import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en } from './en';
import { it } from './it';

export const languages = ['en', 'it'] as const;
export type Language = (typeof languages)[number];

const defaultLanguage: Language = 'en';

function isLanguage(code: string | null | undefined): code is Language {
  return languages.includes(code as Language);
}

function detectLanguage(): Language {
  const deviceLanguage = getLocales()[0]?.languageCode;
  return isLanguage(deviceLanguage) ? deviceLanguage : defaultLanguage;
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    it: { translation: it },
  },
  lng: detectLanguage(),
  fallbackLng: defaultLanguage,
  supportedLngs: languages,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
