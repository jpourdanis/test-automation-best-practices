import './src/i18n'
import React from 'react'
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { StatusBar } from 'expo-status-bar'
import { api } from './src/api/client'
import { readableOn } from './src/colorUtils'
import { ColorPickerModal } from './src/components/ColorPickerModal'
import { ConfirmDialog } from './src/components/ConfirmDialog'

interface Color {
  name: string
  hex: string
}

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'el', label: 'EL' }
]

export default function App() {
  const { t, i18n } = useTranslation()

  const [colors, setColors] = React.useState<Color[]>([])
  const [backgroundColor, setBackgroundColor] = React.useState('#1abc9c')
  const [activeName, setActiveName] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [pickerError, setPickerError] = React.useState<string | null>(null)

  const [confirmTarget, setConfirmTarget] = React.useState<Color | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  React.useEffect(() => {
    api
      .getColors()
      .then((data) => {
        if (data.length > 0) {
          setColors(data)
          setBackgroundColor(data[0].hex)
          setActiveName(data[0].name)
        }
      })
      .catch(() => setError('Failed to load colors'))
      .finally(() => setLoading(false))
  }, [])

  const handleColorPress = async (colorName: string) => {
    setError(null)
    try {
      const data = await api.getColor(colorName)
      setBackgroundColor(data.hex)
      setActiveName(data.name)
    } catch {
      setError(`Failed to load color: ${colorName}`)
    }
  }

  const handleAddColor = async ({ name, hex }: { name: string; hex: string }) => {
    setSaving(true)
    setPickerError(null)
    try {
      const data = await api.addColor(name, hex)
      const list = await api.getColors()
      setColors(list)
      setBackgroundColor(data.hex)
      setActiveName(data.name)
      setPickerOpen(false)
    } catch (err: unknown) {
      const e = err as { status?: number; data?: { error?: string } }
      let msg = e.data?.error ?? 'Network error — could not reach the server.'
      if (e.status === 409) msg = e.data?.error ?? `A color named "${name}" already exists.`
      if (e.status === 429) msg = 'Too many requests. Try again in a moment.'
      if (e.status != null && e.status >= 500) msg = 'Server error. Please try again.'
      setPickerError(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteColor = async () => {
    if (!confirmTarget) return
    const target = confirmTarget
    setDeleting(true)
    setError(null)
    try {
      await api.deleteColor(target.name)
      const list = await api.getColors()
      setColors(list)
      if (activeName === target.name) {
        if (list.length > 0) {
          setBackgroundColor(list[0].hex)
          setActiveName(list[0].name)
        } else {
          setActiveName(null)
        }
      }
      setConfirmTarget(null)
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } }
      setError(e.data?.error ?? 'Network error — could not delete color.')
    } finally {
      setDeleting(false)
    }
  }

  const labelFor = (c: Color): string => {
    const translated = t(`colors.${c.name.toLowerCase()}`, { defaultValue: '' })
    return translated || c.name
  }

  const textColor = readableOn(backgroundColor)
  const isDark = textColor === '#ffffff'
  const activeLang = i18n.resolvedLanguage ?? 'en'

  return (
    <View style={styles.root}>
      <SafeAreaView style={[styles.safe, { backgroundColor }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ScrollView
          style={{ backgroundColor }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Language toggle buttons */}
          <View style={styles.langRow}>
            {LANGUAGES.map((lang) => {
              const isActive = activeLang === lang.code
              return (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => i18n.changeLanguage(lang.code)}
                  accessibilityRole='button'
                  accessibilityState={{ selected: isActive }}
                  style={[
                    styles.langBtn,
                    isActive
                      ? { backgroundColor: 'rgba(255,255,255,0.9)' }
                      : { backgroundColor: 'rgba(255,255,255,0.25)' }
                  ]}
                >
                  <Text style={[styles.langBtnText, { color: isActive ? backgroundColor : textColor }]}>
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: textColor }]}>{t('title')}</Text>

          {/* Error */}
          {error && (
            <View style={styles.errorBox} accessibilityRole='alert'>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Current color */}
          <Text style={[styles.currentColor, { color: textColor }]} accessibilityLiveRegion='polite'>
            {t('currentColor')} {backgroundColor.toUpperCase()}
          </Text>

          {/* Learn React link */}
          <TouchableOpacity onPress={() => Linking.openURL('https://reactjs.org')} accessibilityRole='link'>
            <Text style={[styles.link, { color: isDark ? '#cfe8ff' : '#003366' }]}>{t('learnReact')}</Text>
          </TouchableOpacity>

          {/* Color chips */}
          <View style={styles.chipsSection}>
            {loading && <ActivityIndicator color={textColor} style={{ marginVertical: 16 }} />}

            {!loading && colors.length === 0 && (
              <Text style={[styles.emptyText, { color: textColor }]}>{t('loading')}</Text>
            )}

            {colors.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                {colors.map((c) => (
                  <View key={c.name} style={[styles.chip, activeName === c.name && styles.chipActive]}>
                    <TouchableOpacity
                      style={styles.chipMain}
                      onPress={() => handleColorPress(c.name)}
                      accessibilityLabel={`${t('changeColor')} ${labelFor(c)}`}
                      accessibilityState={{ selected: activeName === c.name }}
                    >
                      <View style={[styles.swatch, { backgroundColor: c.hex }]} />
                      <Text style={[styles.chipLabel, { color: textColor }]}>{labelFor(c)}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.chipX}
                      onPress={() => setConfirmTarget(c)}
                      accessibilityLabel={`${t('remove')}: ${labelFor(c)}`}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                    >
                      <View style={[styles.chipXCircle, { borderColor: `${textColor}60` }]}>
                        <Text style={[styles.chipXText, { color: textColor }]}>✕</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Add button — always visible below the chips row */}
            {!loading && (
              <TouchableOpacity
                style={[styles.btnAdd, { borderColor: `${textColor}60` }]}
                onPress={() => {
                  setPickerError(null)
                  setPickerOpen(true)
                }}
                accessibilityLabel={t('add')}
              >
                <Text style={[styles.btnAddText, { color: textColor }]}>＋ {t('add').replace('+ ', '')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <ColorPickerModal
        visible={pickerOpen}
        existingNames={colors.map((c) => c.name)}
        saving={saving}
        serverError={pickerError}
        onClearError={() => setPickerError(null)}
        onConfirm={handleAddColor}
        onCancel={() => {
          if (!saving) {
            setPickerOpen(false)
            setPickerError(null)
          }
        }}
      />

      <ConfirmDialog
        visible={!!confirmTarget}
        title={t('confirmTitle')}
        colorName={confirmTarget ? labelFor(confirmTarget) : ''}
        swatch={confirmTarget?.hex ?? '#ccc'}
        confirmLabel={deleting ? t('deleting') : t('delete')}
        cancelLabel={t('cancel')}
        busy={deleting}
        onConfirm={handleDeleteColor}
        onCancel={() => {
          if (!deleting) setConfirmTarget(null)
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: 'center',
    minHeight: '100%'
  },

  /* Language toggle */
  langRow: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    gap: 6,
    marginBottom: 28
  },
  langBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20
  },
  langBtnText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5
  },

  /* Title */
  title: {
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: -0.5
  },

  /* Error */
  errorBox: {
    backgroundColor: 'rgba(231,76,60,0.15)',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    width: '100%'
  },
  errorText: {
    color: '#c0392b',
    fontSize: 15,
    textAlign: 'center'
  },

  /* Current color */
  currentColor: {
    fontSize: 17,
    fontWeight: '500',
    opacity: 0.9,
    marginBottom: 12,
    letterSpacing: 0.2
  },

  /* Link */
  link: {
    fontSize: 17,
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginBottom: 36
  },

  /* Chips section */
  chipsSection: {
    width: '100%',
    gap: 14
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    paddingHorizontal: 2
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 28,
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 4
  },
  chipActive: {
    borderColor: 'rgba(255,255,255,0.85)',
    backgroundColor: 'rgba(255,255,255,0.3)'
  },
  chipMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 2
  },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.12)'
  },
  chipLabel: {
    fontSize: 17,
    fontWeight: '600'
  },
  chipX: {
    padding: 2
  },
  chipXCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  chipXText: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14
  },

  /* Add button */
  btnAdd: {
    alignSelf: 'stretch',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnAddText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3
  },

  emptyText: {
    opacity: 0.7,
    textAlign: 'center',
    fontSize: 16,
    marginVertical: 8
  }
})
