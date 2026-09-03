/**
 * Environment Configuration for NearMart Mobile App
 */

// In development, LocalWP is accessible at http://nearmart.local
// For Android Emulators, 10.0.2.2 points to host localhost
// For physical devices, you can provide your local LAN IP
const DEV_API_URL = 'https://flowers:invincible@instinctive-bell.localsite.io/wp-json/nearmart/v1';
const PROD_API_URL = 'https://nearmart.in/wp-json/nearmart/v1';

export const ENV = {
  isDev: __DEV__,
  apiUrl: __DEV__ ? DEV_API_URL : PROD_API_URL,
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