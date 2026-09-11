import { apiClient } from './client';
import { Shop } from '../types/shops';

export interface CustomerFavoritesResponse {
  shop_ids: number[];
  shops: Shop[];
}

export interface FavoriteMutationResponse {
  favorited: boolean;
  shop_id: number;
  shop_ids: number[];
}

export const favoritesApi = {
  /**
   * Fetch authenticated customer's favorite stores
   */
  async getFavorites(params?: { lat?: number | null; lng?: number | null }): Promise<CustomerFavoritesResponse> {
    const queryParams: Record<string, string | number> = {};
    if (params?.lat) queryParams.lat = params.lat;
    if (params?.lng) queryParams.lng = params.lng;
    return apiClient.get<CustomerFavoritesResponse>('/customer/favorites', queryParams);
  },

  /**
   * Add a shop to customer's favorites
   */
  async addFavorite(shopId: number): Promise<FavoriteMutationResponse> {
    return apiClient.post<FavoriteMutationResponse>(`/customer/favorites/${shopId}`);
  },

  /**
   * Remove a shop from customer's favorites
   */
  async removeFavorite(shopId: number): Promise<FavoriteMutationResponse> {
    return apiClient.delete<FavoriteMutationResponse>(`/customer/favorites/${shopId}`);
  },
};
