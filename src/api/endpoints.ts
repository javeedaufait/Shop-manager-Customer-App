export const ENDPOINTS = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
    profile: '/auth/profile',
  },
  shops: {
    list: '/shops',
    detail: (shopId: number) => `/shops/${shopId}`,
    products: (shopId: number) => `/shops/${shopId}/products`,
  },
  products: {
    detail: (productId: number) => `/products/${productId}`,
  },
  cart: {
    get: '/cart',
    items: '/cart/items',
    item: (itemId: string) => `/cart/items/${itemId}`,
    clear: '/cart',
    merge: '/cart/merge',
  },
  orders: {
    create: '/orders',
    list: '/orders',
    detail: (orderId: number | string) => `/orders/${orderId}`,
    status: (orderId: number | string) => `/orders/${orderId}/status`,
  },
  merchant: {
    orders: '/merchant/orders',
    orderDetail: (orderId: number | string) => `/merchant/orders/${orderId}`,
    updateStatus: (orderId: number | string) => `/merchant/orders/${orderId}/status`,
    weigh: (orderId: number | string) => `/merchant/orders/${orderId}/weigh`,
    products: '/merchant/products',
    updateAvailability: (productId: number | string) => `/merchant/products/${productId}/availability`,
  },
  notifications: {
    registerToken: '/notifications/register-token',
    deregisterToken: '/notifications/deregister-token',
  },
};
