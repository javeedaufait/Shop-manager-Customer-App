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
};