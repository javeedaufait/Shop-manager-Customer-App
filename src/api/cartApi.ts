import { apiClient } from './client';
import { Cart, CartItem, AddToCartPayload } from '../types/cart';
import { storageService } from '../services/storageService';

const CART_SESSION_KEY = '@nearmart_cart_session_token';

function generateUuid(): string {
  return 'cart_sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
}

export const cartApi = {
  /**
   * Retrieve or create guest session token.
   */
  async getSessionToken(): Promise<string> {
    let token = await storageService.getItem(CART_SESSION_KEY);
    if (!token) {
      token = generateUuid();
      await storageService.setItem(CART_SESSION_KEY, token);
    }
    return token;
  },

  /**
   * Fetch active cart from backend.
   */
  async getCart(): Promise<{ cart: Cart }> {
    const sessionToken = await this.getSessionToken();
    try {
      const resp = await apiClient.get<{ cart: Cart }>('/cart', {
        cart_session: sessionToken,
      });
      if (resp && resp.cart) {
        return resp;
      }
    } catch (err) {
      console.warn('Backend /cart unreachable, utilizing local cart:', err);
    }

    return {
      cart: {
        shop_id: null,
        shop_name: null,
        items: [],
        item_count: 0,
        total_quantity: 0,
        subtotal: 0,
        session_token: sessionToken,
      },
    };
  },

  /**
   * Add item to cart on server.
   */
  async addItem(payload: AddToCartPayload): Promise<{ cart: Cart }> {
    const sessionToken = await this.getSessionToken();
    const resp = await apiClient.post<{ cart: Cart }>(
      '/cart/items',
      {
        ...payload,
        cart_session: sessionToken,
      },
      { cart_session: sessionToken }
    );
    return resp;
  },

  /**
   * Update item quantity on server.
   */
  async updateItem(itemId: string, quantity: number): Promise<{ cart: Cart }> {
    const sessionToken = await this.getSessionToken();
    const resp = await apiClient.put<{ cart: Cart }>(
      '/cart/items/' + itemId,
      { quantity, cart_session: sessionToken },
      { cart_session: sessionToken }
    );
    return resp;
  },

  /**
   * Remove item from cart on server.
   */
  async removeItem(itemId: string): Promise<{ cart: Cart }> {
    const sessionToken = await this.getSessionToken();
    const resp = await apiClient.delete<{ cart: Cart }>(
      '/cart/items/' + itemId,
      { cart_session: sessionToken }
    );
    return resp;
  },

  /**
   * Clear active cart on server.
   */
  async clearCart(): Promise<{ cart: Cart }> {
    const sessionToken = await this.getSessionToken();
    const resp = await apiClient.delete<{ cart: Cart }>('/cart', {
      cart_session: sessionToken,
    });
    return resp;
  },

  /**
   * Merge guest cart into customer account upon login.
   */
  async mergeGuestCart(guestToken: string): Promise<{ cart: Cart }> {
    const resp = await apiClient.post<{ cart: Cart }>('/cart/merge', {
      guest_cart_token: guestToken,
    });
    return resp;
  },
};
