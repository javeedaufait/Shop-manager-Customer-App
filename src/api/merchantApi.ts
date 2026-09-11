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

export interface MerchantCatalogProduct {
  id: number;
  product_id: number | null;
  is_standalone: boolean;
  name: string;
  category?: string;
  unit: string | null;
  brand: string | null;
  barcode: string | null;
  shop_sku: string | null;
  price: number;
  sale_price: number | null;
  available: boolean;
  stock_status: 'instock' | 'outofstock';
  image: string | null;
}

export interface GetMerchantProductsParams {
  search?: string;
  status?: 'all' | 'instock' | 'outofstock';
  page?: number;
  limit?: number;
  lang?: 'en' | 'ml';
}

export interface MerchantProductsResponse {
  products: MerchantCatalogProduct[];
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

  /**
   * Fetch paginated list of catalog products for the merchant's assigned shop.
   * Supports search and availability status filtering ('all', 'instock', 'outofstock').
   */
  async getProducts(params?: GetMerchantProductsParams): Promise<MerchantProductsResponse> {
    const query: Record<string, string | number> = {};
    if (params?.search) query.search = params.search;
    if (params?.status && params.status !== 'all') query.status = params.status;
    if (params?.page) query.page = params.page;
    if (params?.limit) query.limit = params.limit;
    if (params?.lang) query.lang = params.lang;

    const resp = await apiClient.get<MerchantProductsResponse>(
      ENDPOINTS.merchant.products,
      query
    );
    return resp;
  },

  /**
   * Toggle or update availability for a specific shop catalog product.
   */
  async updateProductAvailability(
    productId: number | string,
    available: boolean
  ): Promise<MerchantCatalogProduct> {
    const resp = await apiClient.post<{ product: MerchantCatalogProduct }>(
      ENDPOINTS.merchant.updateAvailability(productId),
      { available }
    );
    return resp.product;
  },
};
