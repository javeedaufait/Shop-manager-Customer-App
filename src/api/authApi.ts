import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import {
  AuthSessionData,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
  UserProfile,
} from '../types/auth';

export const authApi = {
  /**
   * Register a new customer
   */
  async register(payload: RegisterPayload): Promise<AuthSessionData> {
    return await apiClient.post<AuthSessionData>(ENDPOINTS.auth.register, payload);
  },

  /**
   * Authenticate customer or merchant
   */
  async login(payload: LoginPayload): Promise<AuthSessionData> {
    return await apiClient.post<AuthSessionData>(ENDPOINTS.auth.login, payload);
  },

  /**
   * Invalidate mobile session
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(ENDPOINTS.auth.logout);
    } catch (e) {
      // Local session cleanup proceeds even if network fails
      console.warn('Backend logout warning:', e);
    }
  },

  /**
   * Fetch current authenticated user & linked shop
   */
  async getMe(): Promise<{ user: UserProfile }> {
    return await apiClient.get<{ user: UserProfile }>(ENDPOINTS.auth.me);
  },

  /**
   * Update profile details
   */
  async updateProfile(payload: UpdateProfilePayload): Promise<{ user: UserProfile; token?: string }> {
    return await apiClient.put<{ user: UserProfile; token?: string }>(ENDPOINTS.auth.profile, payload);
  },
};