import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getLocales } from 'expo-localization'

import en from './locales/en.json'
import es from './locales/es.json'
import el from './locales/el.json'

const deviceLang = getLocales()[0]?.languageCode ?? 'en'

i18n.use(initReactI18next).init({
  fallbackLng: 'en',
  lng: deviceLang,
  interpolation: { escapeValue: false },
  resources: {
    en: { translation: en },
    es: { translation: es },
    el: { translation: el }
  }
})

export default i18n
