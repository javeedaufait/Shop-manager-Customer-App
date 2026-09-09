/**
 * Environment Configuration for NearMart Mobile App
 */

// In development and preview testing, use your live test server IP
const LIVE_SERVER_URL = 'http://20.204.107.25/nearmart/wp-json/nearmart/v1';
// const PROD_API_URL = 'https://nearmart.in/wp-json/nearmart/v1'; // Use when nearmart.in domain + SSL is configured

export const ENV = {
  isDev: __DEV__,
  apiUrl: LIVE_SERVER_URL,
  apiTimeout: 15000, // 15 seconds
  storageKeys: {
    authToken: 'nearmart_auth_token',
    authUser: 'nearmart_auth_user',
    language: 'nearmart_user_language',
    onboardingCompleted: 'nearmart_onboarding_completed',
  },
  supportedLanguages: ['en', 'ml'] as const,
  defaultLanguage: 'en' as const,
};

export type SupportedLanguage = (typeof ENV.supportedLanguages)[number];