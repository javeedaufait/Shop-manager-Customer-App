import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';

export interface RegisterTokenPayload {
  token: string;
  platform?: 'android' | 'ios' | 'web';
  device_id?: string;
  lang?: 'en' | 'ml';
}

export interface RegisterTokenResponse {
  user_id: number;
  token: string;
  platform: string;
  device_id: string;
}

export const notificationApi = {
  /**
   * Register or refresh user push token in backend.
   */
  async registerToken(payload: RegisterTokenPayload): Promise<RegisterTokenResponse> {
    return await apiClient.post<RegisterTokenResponse>(
      ENDPOINTS.notifications.registerToken,
      payload
    );
  },

  /**
   * Deregister push token from backend on logout.
   */
  async deregisterToken(token: string): Promise<void> {
    try {
      await apiClient.post(ENDPOINTS.notifications.deregisterToken, { token });
    } catch (e) {
      console.warn('Failed to deregister push token:', e);
    }
  },
};
