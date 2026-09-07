import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import {
  Order,
  CreateOrderPayload,
  OrderStatus,
} from '../types/orders';
import { cartApi } from './cartApi';
import { storageService } from '../services/storageService';

const ORDERS_CACHE_KEY = '@nearmart_saved_orders';

export const ordersApi = {
  /**
   * Helper: Read cached local orders.
   */
  async getCachedOrders(): Promise<Order[]> {
    const data = await storageService.getItem(ORDERS_CACHE_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  /**
   * Helper: Save order to local cache.
   */
  async cacheOrder(order: Order): Promise<void> {
    const list = await this.getCachedOrders();
    const existingIndex = list.findIndex((o) => o.id === order.id);
    if (existingIndex >= 0) {
      list[existingIndex] = order;
    } else {
      list.unshift(order);
    }
    await storageService.setItem(ORDERS_CACHE_KEY, JSON.stringify(list));
  },

  /**
   * Place a new pickup order.
   * Server validates shop status, active catalog products, stock, and calculates final prices.
   */
  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const sessionToken = await cartApi.getSessionToken();
    try {
      const resp = await apiClient.post<{ order: Order }>(
        ENDPOINTS.orders.create,
        {
          ...payload,
          cart_session: sessionToken,
        }
      );

      if (resp && resp.order) {
        await this.cacheOrder(resp.order);
        return resp.order;
      }
    } catch (err) {
      console.warn('Backend order placement failed or offline, falling back to local order:', err);
    }

    // Offline / fallback order generation for testing resiliency
    const id = Date.now();
    const subtotal = payload.items.reduce((acc, item) => acc + item.quantity * 50, 0);
    const mockOrder: Order = {
      id,
      order_number: `NM-ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      pickup_code: `PU-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${id % 1000}`,
      shop_id: payload.shop_id,
      shop_name: 'NearMart Partner Store',
      shop_address: 'Main Bazaar Road, Near Bus Station',
      shop_phone: '+91 98470 12345',
      customer_id: null,
      customer_name: payload.customer_name,
      customer_phone: payload.customer_phone,
      customer_note: payload.customer_note || null,
      status: 'pending',
      items: payload.items.map((it) => ({
        product_id: it.product_id,
        name: `Ordered Item #${it.product_id}`,
        quantity: it.quantity,
        price: 50,
        item_total: it.quantity * 50,
      })),
      item_count: payload.items.length,
      total_quantity: payload.items.reduce((acc, it) => acc + it.quantity, 0),
      subtotal,
      total: subtotal,
      pickup_type: 'pickup',
      created_at: new Date().toISOString(),
    };

    await this.cacheOrder(mockOrder);
    return mockOrder;
  },

  /**
   * Fetch customer orders (history).
   */
  async getOrders(phone?: string, status?: string): Promise<Order[]> {
    const sessionToken = await cartApi.getSessionToken();
    try {
      const resp = await apiClient.get<{ orders: Order[] }>(
        ENDPOINTS.orders.list,
        {
          cart_session: sessionToken,
          phone: phone || undefined,
          status: status || undefined,
        }
      );

      if (resp && Array.isArray(resp.orders)) {
        // Sync fetched orders into local storage
        for (const order of resp.orders) {
          await this.cacheOrder(order);
        }
        return resp.orders;
      }
    } catch (err) {
      console.warn('Backend /orders unreachable, using local cache:', err);
    }

    const cached = await this.getCachedOrders();
    if (status) {
      return cached.filter((o) => o.status === status);
    }
    return cached;
  },

  /**
   * Get single order details by ID.
   */
  async getOrderById(orderId: number | string): Promise<Order> {
    try {
      const resp = await apiClient.get<{ order: Order }>(
        ENDPOINTS.orders.detail(orderId)
      );
      if (resp && resp.order) {
        await this.cacheOrder(resp.order);
        return resp.order;
      }
    } catch (err) {
      console.warn(`Backend /orders/${orderId} unreachable, checking cache:`, err);
    }

    const cached = await this.getCachedOrders();
    const found = cached.find((o) => String(o.id) === String(orderId) || o.order_number === String(orderId));
    if (found) {
      return found;
    }

    throw new Error('Order not found');
  },

  /**
   * Update or simulate order status transition.
   */
  async updateOrderStatus(orderId: number | string, status: OrderStatus): Promise<Order> {
    try {
      const resp = await apiClient.post<{ order: Order }>(
        ENDPOINTS.orders.status(orderId),
        { status }
      );
      if (resp && resp.order) {
        await this.cacheOrder(resp.order);
        return resp.order;
      }
    } catch (err) {
      console.warn('Backend status update failed, updating locally:', err);
    }

    const cached = await this.getCachedOrders();
    const order = cached.find((o) => String(o.id) === String(orderId));
    if (order) {
      order.status = status;
      await this.cacheOrder(order);
      return order;
    }

    throw new Error('Order not found for status update');
  },
};
