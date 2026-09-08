import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import { Order, OrderStatus, WeighedItemInput } from '../types/orders';

export interface GetMerchantOrdersParams {
  search?: string;
  fulfillment_status?: string;
  pricing_status?: string;
  payment_status?: string;
  limit?: number;
  page?: number;
}

export interface MerchantOrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export const merchantApi = {
  /**
   * Fetch paginated list of orders for the merchant's assigned shop.
   * Supports debounced search, fulfillment status, pricing status, and payment status filters.
   */
  async getOrders(params?: GetMerchantOrdersParams): Promise<MerchantOrdersResponse> {
    const query: Record<string, string | number> = {};
    if (params?.search) query.search = params.search;
    if (params?.fulfillment_status && params.fulfillment_status !== 'all') {
      query.fulfillment_status = params.fulfillment_status;
      query.status = params.fulfillment_status;
    }
    if (params?.pricing_status && params.pricing_status !== 'all') {
      query.pricing_status = params.pricing_status;
    }
    if (params?.payment_status && params.payment_status !== 'all') {
      query.payment_status = params.payment_status;
    }
    if (params?.limit) query.limit = params.limit;
    if (params?.page) query.page = params.page;

    try {
      const resp = await apiClient.get<MerchantOrdersResponse>(
        ENDPOINTS.merchant.orders,
        query
      );
      if (resp && Array.isArray(resp.orders)) {
        return resp;
      }
    } catch (err) {
      console.warn('Backend merchant orders fetch error:', err);
      throw err;
    }

    return {
      orders: [],
      pagination: { page: 1, limit: 20, total: 0, total_pages: 1 },
    };
  },

  /**
   * Fetch complete order details snapshot for an order belonging to merchant's shop.
   */
  async getOrderDetail(orderId: number | string): Promise<Order> {
    const resp = await apiClient.get<{ order: Order }>(
      ENDPOINTS.merchant.orderDetail(orderId)
    );
    return resp.order;
  },

  /**
   * Update fulfillment status for an order (e.g. accepted, preparing, ready_for_pickup, completed, rejected).
   * Optional reason parameter for rejections.
   */
  async updateOrderStatus(
    orderId: number | string,
    status: OrderStatus,
    reason?: string
  ): Promise<Order> {
    const resp = await apiClient.post<{ order: Order }>(
      ENDPOINTS.merchant.updateStatus(orderId),
      { status, reason }
    );
    return resp.order;
  },

  /**
   * Submit weighed produce quantities and prices (APP-8.2).
   */
  async weighOrderItems(
    orderId: number | string,
    items: WeighedItemInput[]
  ): Promise<Order> {
    const resp = await apiClient.post<{ order: Order }>(
      ENDPOINTS.merchant.weigh(orderId),
      { items }
    );
    return resp.order;
  },
};
