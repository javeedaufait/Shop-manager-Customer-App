import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { t, TranslationKey } from '../i18n';
import { SupportedLanguage } from '../config/env';

export const useLocalization = () => {
  const { language, setLanguage } = useAuth();

  const translate = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      return t(key, params);
    },
    [language]
  );

  return {
    language,
    setLanguage: useCallback((lang: SupportedLanguage) => setLanguage(lang), [setLanguage]),
    t: translate,
  };
};
