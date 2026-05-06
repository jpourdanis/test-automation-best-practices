import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getLocales } from 'expo-localization'

import { enTranslations, esTranslations, elTranslations } from '@color-app/shared/locales'

const deviceLang = getLocales()[0]?.languageCode ?? 'en'

i18n.use(initReactI18next).init({
  fallbackLng: 'en',
  lng: deviceLang,
  interpolation: { escapeValue: false },
  resources: {
    en: { translation: enTranslations },
    es: { translation: esTranslations },
    el: { translation: elTranslations }
  }
})

export default i18n
