import { en } from './en';
import { ml } from './ml';
import { SupportedLanguage } from '../config/env';

export type TranslationDictionary = typeof en;

const dictionaries: Record<SupportedLanguage, TranslationDictionary> = {
  en,
  ml,
};

let currentLanguage: SupportedLanguage = 'en';

export const setI18nLanguage = (lang: SupportedLanguage) => {
  if (dictionaries[lang]) {
    currentLanguage = lang;
  }
};

export const getI18nLanguage = (): SupportedLanguage => {
  return currentLanguage;
};

/**
 * Nested key path type helper
 */
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<TranslationDictionary>;

/**
 * Translate key with fallback to English
 */
export const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
  const keys = key.split('.');
  
  let current: any = dictionaries[currentLanguage];
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      current = undefined;
      break;
    }
  }

  // Fallback to English if translation missing in Malayalam
  if (typeof current !== 'string') {
    let fallback: any = dictionaries['en'];
    for (const k of keys) {
      if (fallback && typeof fallback === 'object' && k in fallback) {
        fallback = fallback[k];
      } else {
        fallback = undefined;
        break;
      }
    }
    current = typeof fallback === 'string' ? fallback : key;
  }

  // Replace {variables} if params provided
  if (params && typeof current === 'string') {
    Object.keys(params).forEach((paramKey) => {
      current = current.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(params[paramKey]));
    });
  }

  return current;
};