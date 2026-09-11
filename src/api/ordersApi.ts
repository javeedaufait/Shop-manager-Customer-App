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
      throw new Error('Unexpected order response format');
    } catch (err) {
      console.warn('Backend order placement failed:', err);
      throw err;
    }
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

  /**
   * Revalidate previous order items against live catalog pricing and availability.
   */
  async getReorderValidation(orderId: number | string): Promise<ReorderValidationResponse> {
    return apiClient.get<ReorderValidationResponse>(`/orders/${orderId}/reorder`);
  },
};

export interface ReorderItem {
  product_id: number;
  master_product_id?: number | null;
  name: string;
  unit?: string | null;
  image?: string | null;
  brand?: string | null;
  category?: string | null;
  current_price: number;
  regular_price: number;
  sale_price?: number | null;
  old_price: number;
  price_changed: boolean;
  pricing_type: 'fixed' | 'store_priced';
  is_store_priced: boolean;
  available: boolean;
  stock_quantity?: number | null;
  requested_quantity: number;
  can_reorder: boolean;
  unavailable_reason?: string | null;
}

export interface ReorderValidationResponse {
  order_id: number;
  shop_id: number;
  shop_name: string;
  items: ReorderItem[];
  all_available: boolean;
  available_count: number;
  unavailable_count: number;
}

