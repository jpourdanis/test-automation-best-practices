import React from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native'
import Slider from '@react-native-community/slider'
import { LinearGradient } from 'expo-linear-gradient'
import { useTranslation } from 'react-i18next'
import { hslToRgb, rgbToHex, readableOn } from '../colorUtils'

interface Props {
  visible: boolean
  existingNames: string[]
  saving: boolean
  serverError: string | null
  onClearError: () => void
  onConfirm: (color: { name: string; hex: string }) => void
  onCancel: () => void
}

export function ColorPickerModal({
  visible,
  existingNames,
  saving,
  serverError,
  onClearError,
  onConfirm,
  onCancel
}: Props) {
  const { t } = useTranslation()

  const [name, setName] = React.useState('')
  const [hue, setHue] = React.useState(180)
  const [sat, setSat] = React.useState(0.6)
  const [lit, setLit] = React.useState(0.5)
  const [nameError, setNameError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!visible) {
      setName('')
      setHue(180)
      setSat(0.6)
      setLit(0.5)
      setNameError(null)
    }
  }, [visible])

  const [r, g, b] = hslToRgb(hue, sat, lit)
  const hex = rgbToHex(r, g, b)
  const previewText = readableOn(hex)

  const hueStops: [string, string, ...string[]] = [
    '#ff0000',
    '#ffff00',
    '#00ff00',
    '#00ffff',
    '#0000ff',
    '#ff00ff',
    '#ff0000'
  ]
  const [fullR, fullG, fullB] = hslToRgb(hue, 1, 0.5)
  const fullHex = rgbToHex(fullR, fullG, fullB)
  const satStops: [string, string] = [`hsl(${hue},0%,50%)`, fullHex]
  const litStops: [string, string, string] = ['#000000', fullHex, '#ffffff']

  const handleConfirm = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setNameError('Name is required.')
      return
    }
    if (existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      setNameError(`"${trimmed}" already exists.`)
      return
    }
    onConfirm({ name: trimmed, hex })
  }

  return (
    <Modal visible={visible} transparent animationType='slide' onRequestClose={() => !saving && onCancel()}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps='handled'>
            {/* Preview swatch */}
            <View style={[styles.preview, { backgroundColor: hex }]}>
              <Text style={[styles.previewHex, { color: previewText }]}>{hex.toUpperCase()}</Text>
            </View>

            {/* Hue slider */}
            <Text style={styles.label}>Hue</Text>
            <LinearGradient colors={hueStops} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.track}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={360}
                step={1}
                value={hue}
                onValueChange={setHue}
                minimumTrackTintColor='transparent'
                maximumTrackTintColor='transparent'
                thumbTintColor='#ffffff'
              />
            </LinearGradient>

            {/* Saturation slider */}
            <Text style={styles.label}>Saturation</Text>
            <LinearGradient colors={satStops} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.track}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                step={0.01}
                value={sat}
                onValueChange={setSat}
                minimumTrackTintColor='transparent'
                maximumTrackTintColor='transparent'
                thumbTintColor='#ffffff'
              />
            </LinearGradient>

            {/* Lightness slider */}
            <Text style={styles.label}>Lightness</Text>
            <LinearGradient colors={litStops} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.track}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                step={0.01}
                value={lit}
                onValueChange={setLit}
                minimumTrackTintColor='transparent'
                maximumTrackTintColor='transparent'
                thumbTintColor='#ffffff'
              />
            </LinearGradient>

            {/* Name input */}
            <Text style={styles.label}>{t('name') ?? 'Name'}</Text>
            <TextInput
              style={[styles.input, nameError ? styles.inputError : null]}
              placeholder='e.g. Ocean Blue'
              placeholderTextColor='#aaa'
              value={name}
              onChangeText={(v) => {
                setName(v)
                setNameError(null)
                onClearError()
              }}
              autoCorrect={false}
              returnKeyType='done'
            />

            {/* Validation / server errors */}
            {(nameError || serverError) && <Text style={styles.errorText}>{nameError ?? serverError}</Text>}

            {/* Buttons */}
            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={onCancel} disabled={saving}>
                <Text style={styles.btnCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnSave, { backgroundColor: hex }]}
                onPress={handleConfirm}
                disabled={saving}
              >
                <Text style={[styles.btnSaveText, { color: previewText }]}>
                  {saving ? (t('saving') ?? 'Saving…') : (t('save') ?? 'Save')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '90%'
  },
  preview: {
    height: 90,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24
  },
  previewHex: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 1
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  track: {
    height: 36,
    borderRadius: 18,
    marginBottom: 18,
    justifyContent: 'center',
    overflow: 'hidden'
  },
  slider: {
    width: '100%',
    height: 36
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111',
    marginBottom: 8
  },
  inputError: {
    borderColor: '#e74c3c'
  },
  errorText: {
    color: '#c0392b',
    fontSize: 13,
    marginBottom: 12
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8
  },
  btn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center'
  },
  btnCancel: {
    backgroundColor: '#f0f0f0'
  },
  btnCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555'
  },
  btnSave: {
    elevation: 2
  },
  btnSaveText: {
    fontSize: 16,
    fontWeight: '700'
  }
})
