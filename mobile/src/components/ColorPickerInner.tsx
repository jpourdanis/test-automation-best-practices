import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions
} from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useTranslation } from 'react-i18next'
// This import is intentionally in its own file so React.lazy() defers it
// until after Reanimated's native runtime is fully initialised.
import ColorPicker, { Panel3, LuminanceSlider, Preview } from 'reanimated-color-picker'
import type { ColorFormatsObject } from 'reanimated-color-picker'
import { readableOn } from '../colorUtils'

export interface ColorPickerInnerProps {
  existingNames: string[]
  saving: boolean
  serverError: string | null
  onClearError: () => void
  onConfirm: (color: { name: string; hex: string }) => void
  onCancel: () => void
}

const STRICT = /^[a-zA-Z0-9]([a-zA-Z0-9 +]*[a-zA-Z0-9])?$/
const INITIAL_HEX = '#3478f6'
const H_PAD = 40 // 20px each side

export default function ColorPickerInner({
  existingNames,
  saving,
  serverError,
  onClearError,
  onConfirm,
  onCancel
}: ColorPickerInnerProps) {
  const { t } = useTranslation()
  const { width: screenWidth } = useWindowDimensions()
  const wheelSize = screenWidth - H_PAD

  const [hex, setHex] = useState(INITIAL_HEX)
  const [hexInput, setHexInput] = useState(INITIAL_HEX)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [hexError, setHexError] = useState('')

  useEffect(() => {
    if (serverError) onClearError()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name])

  const onPickerComplete = (colors: ColorFormatsObject) => {
    const h = colors.hex.toLowerCase()
    setHex(h)
    setHexInput(h)
    setHexError('')
  }

  const onHexInputChange = (v: string) => {
    setHexInput(v)
    const full = v.startsWith('#') ? v : `#${v}`
    if (/^#[0-9a-fA-F]{6}$/.test(full)) {
      setHex(full.toLowerCase())
      setHexError('')
    } else {
      setHexError(t('colorPicker.errors.hexFormat'))
    }
  }

  const submit = () => {
    const n = name.trim()
    if (!n) {
      setNameError(t('colorPicker.errors.nameRequired'))
      return
    }
    if (!STRICT.test(n)) {
      setNameError(t('colorPicker.errors.nameInvalid'))
      return
    }
    if (existingNames.some((e) => e.toLowerCase() === n.toLowerCase())) {
      setNameError(t('colorPicker.errors.nameDuplicate', { name: n }))
      return
    }
    if (hexError) return
    onConfirm({ name: n, hex })
  }

  const textColor = readableOn(hex)

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('colorPicker.title')}</Text>
            <TouchableOpacity
              onPress={() => !saving && onCancel()}
              accessibilityLabel={t('colorPicker.closeAriaLabel')}
            >
              <Text style={styles.closeBtn}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <ColorPicker value={hex} onComplete={onPickerComplete} style={styles.pickerRoot}>
              <Panel3 style={{ width: wheelSize, height: wheelSize, alignSelf: 'center' }} />
              <LuminanceSlider style={styles.slider} />
              <Preview style={[styles.preview, { borderColor: hex }]} hideInitialColor />
            </ColorPicker>

            <View style={styles.fields}>
              <View style={styles.field}>
                <Text style={styles.label}>{t('colorPicker.nameLabel')}</Text>
                <TextInput
                  style={[styles.input, !!nameError && styles.inputError]}
                  value={name}
                  placeholder={t('colorPicker.namePlaceholder')}
                  onChangeText={(v) => {
                    setName(v)
                    setNameError('')
                  }}
                  onSubmitEditing={submit}
                  maxLength={24}
                  returnKeyType='done'
                  accessibilityLabel={t('colorPicker.nameLabel')}
                />
                {!!nameError && <Text style={styles.errorText}>{nameError}</Text>}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>{t('colorPicker.hexLabel')}</Text>
                <View style={[styles.hexRow, { backgroundColor: hex }]}>
                  <TextInput
                    style={[styles.input, styles.hexInput, { color: textColor, borderColor: hex }]}
                    value={hexInput}
                    onChangeText={onHexInputChange}
                    autoCapitalize='none'
                    autoCorrect={false}
                    spellCheck={false}
                    accessibilityLabel={t('colorPicker.hexLabel')}
                  />
                </View>
                {!!hexError && <Text style={styles.errorText}>{hexError}</Text>}
              </View>

              {serverError && (
                <View style={styles.serverError} accessibilityRole='alert'>
                  <Text style={styles.serverErrorIcon}>!</Text>
                  <Text style={styles.serverErrorText}>{serverError}</Text>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnGhost]}
              onPress={() => !saving && onCancel()}
              disabled={saving}
            >
              <Text style={styles.btnGhostText}>{t('colorPicker.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, saving && styles.btnDisabled]}
              onPress={submit}
              disabled={saving}
            >
              <Text style={styles.btnPrimaryText}>{saving ? t('colorPicker.saving') : t('colorPicker.addColor')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  gestureRoot: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    maxHeight: '92%'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111' },
  closeBtn: { fontSize: 28, color: '#666', lineHeight: 32, paddingHorizontal: 4 },
  pickerRoot: { gap: 12 },
  slider: { height: 36, borderRadius: 8 },
  preview: { height: 52, borderRadius: 10, borderWidth: 1 },
  fields: { marginTop: 16, gap: 12 },
  field: { gap: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#555' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111',
    backgroundColor: '#fafafa'
  },
  inputError: { borderColor: '#e74c3c' },
  hexRow: { borderRadius: 8, padding: 2 },
  hexInput: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  errorText: { fontSize: 12, color: '#e74c3c' },
  serverError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdecea',
    borderRadius: 8,
    padding: 10,
    gap: 8
  },
  serverErrorIcon: { color: '#e74c3c', fontWeight: '700', fontSize: 16 },
  serverErrorText: { flex: 1, color: '#c0392b', fontSize: 13 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  btnGhost: { backgroundColor: '#f0f0f0' },
  btnGhostText: { color: '#333', fontWeight: '600', fontSize: 15 },
  btnPrimary: { backgroundColor: '#1abc9c' },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnDisabled: { opacity: 0.5 }
})
