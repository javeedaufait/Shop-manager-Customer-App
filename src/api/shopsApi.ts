import { apiClient } from './client';
import { NearbyShopsResponse, AreaHub } from '../types/shops';

export interface NearbyShopsParams {
  lat?: number | null;
  lng?: number | null;
  radius?: number;
  area?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const shopsApi = {
  /**
   * Fetch nearby shops with optional GPS coordinates, radius, or area text filter.
   */
  async getNearbyShops(params: NearbyShopsParams = {}): Promise<NearbyShopsResponse> {
    const queryParams: Record<string, string | number> = {};

    if (params.lat !== undefined && params.lat !== null) queryParams.lat = params.lat;
    if (params.lng !== undefined && params.lng !== null) queryParams.lng = params.lng;
    if (params.radius) queryParams.radius = params.radius;
    if (params.area) queryParams.area = params.area;
    if (params.search) queryParams.search = params.search;
    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;

    return apiClient.get<NearbyShopsResponse>('/shops/nearby', queryParams);
  },

  /**
   * Fetch discoverable areas for manual selection.
   */
  async getAreas(): Promise<{ areas: AreaHub[] }> {
    return apiClient.get<{ areas: AreaHub[] }>('/areas');
  },
};