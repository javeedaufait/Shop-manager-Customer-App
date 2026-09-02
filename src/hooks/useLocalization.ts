import { useAuth } from './useAuth';
import { t, TranslationKey } from '../i18n';
import { SupportedLanguage } from '../config/env';

export const useLocalization = () => {
  const { language, setLanguage } = useAuth();

  const translate = (key: TranslationKey, params?: Record<string, string | number>) => {
    return t(key, params);
  };

  return {
    language,
    setLanguage: (lang: SupportedLanguage) => setLanguage(lang),
    t: translate,
  };
};