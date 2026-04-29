import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import { enTranslations, esTranslations, elTranslations } from '@color-app/shared'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: process.env.NODE_ENV !== 'test', // Disable debug in test environment
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    resources: {
      en: { translation: enTranslations },
      es: { translation: esTranslations },
      el: { translation: elTranslations }
    }
  })

export default i18n
