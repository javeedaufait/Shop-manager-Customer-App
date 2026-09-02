import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole, LoginPayload, RegisterPayload } from '../types/auth';
import { authApi } from '../api/authApi';
import { apiClient } from '../api/client';
import { storageService } from '../services/storageService';
import { ENV, SupportedLanguage } from '../config/env';
import { setI18nLanguage } from '../i18n';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  continueAsGuest: () => void;
  isLoading: boolean;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [language, setLanguageState] = useState<SupportedLanguage>(ENV.defaultLanguage);

  // Initialize Auth & Language on boot
  useEffect(() => {
    const initialize = async () => {
      try {
        // 1. Restore Language preference
        const savedLang = await storageService.getItem(ENV.storageKeys.language);
        if (savedLang === 'en' || savedLang === 'ml') {
          setLanguageState(savedLang);
          setI18nLanguage(savedLang);
        }

        // 2. Restore Token
        const storedToken = await storageService.getSecureItem(ENV.storageKeys.authToken);
        if (storedToken) {
          apiClient.setToken(storedToken);
          setToken(storedToken);

          // Validate token with backend /auth/me
          const meData = await authApi.getMe();
          if (meData?.user) {
            setUser(meData.user);
            await storageService.setItem(ENV.storageKeys.authUser, JSON.stringify(meData.user));
          } else {
            // Invalid session
            await handleClearSession();
          }
        }
      } catch (err) {
        console.warn('Boot auth restore failed, clearing session:', err);
        await handleClearSession();
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  const continueAsGuest = () => {
    setIsGuest(true);
  };

  const handleClearSession = async () => {
    setIsGuest(false);
    setUser(null);
    setToken(null);
    apiClient.setToken(null);
    await storageService.deleteSecureItem(ENV.storageKeys.authToken);
    await storageService.removeItem(ENV.storageKeys.authUser);
  };

  const setLanguage = async (newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    setI18nLanguage(newLang);
    await storageService.setItem(ENV.storageKeys.language, newLang);
  };

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const data = await authApi.login(payload);
      setUser(data.user);
      setToken(data.token);
      apiClient.setToken(data.token);

      await storageService.setSecureItem(ENV.storageKeys.authToken, data.token);
      await storageService.setItem(ENV.storageKeys.authUser, JSON.stringify(data.user));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      const data = await authApi.register(payload);
      setUser(data.user);
      setToken(data.token);
      apiClient.setToken(data.token);

      await storageService.setSecureItem(ENV.storageKeys.authToken, data.token);
      await storageService.setItem(ENV.storageKeys.authUser, JSON.stringify(data.user));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch (e) {
      console.warn('Backend logout warning:', e);
    } finally {
      await handleClearSession();
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const data = await authApi.getMe();
      if (data?.user) {
        setUser(data.user);
        await storageService.setItem(ENV.storageKeys.authUser, JSON.stringify(data.user));
      }
    } catch (e) {
      console.warn('Failed to refresh profile:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isAuthenticated: !!token && !!user,
        isLoading,
        language,
        setLanguage,
        login,
        register,
        logout,
        refreshProfile,
        isGuest,
        continueAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};