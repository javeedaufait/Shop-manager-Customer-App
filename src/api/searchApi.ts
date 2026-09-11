import { apiClient } from './client';
import { NearbySearchResponse } from '../types/catalog';

export interface NearbySearchParams {
  q: string;
  lat?: number | null;
  lng?: number | null;
  radius?: number;
  area?: string;
  page?: number;
  limit?: number;
  lang?: 'en' | 'ml';
}

export const searchApi = {
  /**
   * Search products across nearby shops within user's proximity.
   * Endpoint: GET /wp-json/nearmart/v1/products/search
   */
  async searchNearbyProducts(params: NearbySearchParams): Promise<NearbySearchResponse> {
    const queryParams: Record<string, string | number> = {
      q: params.q.trim(),
    };

    if (params.lat !== undefined && params.lat !== null) queryParams.lat = params.lat;
    if (params.lng !== undefined && params.lng !== null) queryParams.lng = params.lng;
    if (params.radius) queryParams.radius = params.radius;
    if (params.area) queryParams.area = params.area;
    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;
    if (params.lang) queryParams.lang = params.lang;

    try {
      const response = await apiClient.get<NearbySearchResponse>('/products/search', queryParams);
      if (response && Array.isArray(response.products)) {
        return response;
      }
    } catch (err) {
      console.warn('Backend /products/search request note:', err);
    }

    return {
      products: [],
      pagination: {
        page: params.page || 1,
        limit: params.limit || 20,
        total: 0,
        total_pages: 0,
      },
      query: params.q,
    };
  },
};
