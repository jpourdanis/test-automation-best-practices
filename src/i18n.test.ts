import i18n from './i18n'

describe('Frontend Unit Tests', () => {
  describe('i18n Configuration', () => {
    test('should be initialized with correct settings', () => {
      expect(i18n.isInitialized).toBe(true)
      expect(i18n.options.fallbackLng).toContain('en')
      expect(i18n.options.debug).toBe(process.env.NODE_ENV !== 'test')
    })

    test('should have defined resources for en, es, el', () => {
      expect(i18n.options.resources).toHaveProperty('en')
      expect(i18n.options.resources).toHaveProperty('es')
      expect(i18n.options.resources).toHaveProperty('el')
    })

    test('should have translation keys in resources', () => {
      const enResources = i18n.getResourceBundle('en', 'translation')
      expect(enResources).toHaveProperty('title')
      expect(enResources).toHaveProperty('colors')
    })

    test('should translate keys correctly', () => {
      expect(i18n.t('title')).toBe('Color Chooser App')
      expect(i18n.t('colors.red')).toBe('Red')
    })

    test('should handle language change correctly', async () => {
      await i18n.changeLanguage('es')
      expect(i18n.language).toBe('es')
      expect(i18n.t('title')).toBe('Aplicación de elección de color')

      await i18n.changeLanguage('el')
      expect(i18n.language).toBe('el')
      expect(i18n.t('title')).toBe('Εφαρμογή επιλογής χρώματος')
    })

    test('interpolation should not escape value', () => {
      expect(i18n.options.interpolation?.escapeValue).toBe(false)
    })
  })
})
