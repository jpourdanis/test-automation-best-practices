import React from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Trans } from 'react-i18next'

interface Props {
  visible: boolean
  title: string
  colorName: string
  swatch: string
  confirmLabel: string
  cancelLabel: string
  busy: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  visible,
  title,
  colorName,
  swatch,
  confirmLabel,
  cancelLabel,
  busy,
  onConfirm,
  onCancel
}: Props) {
  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={() => !busy && onCancel()}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityRole='alert' accessibilityViewIsModal>
          <View style={[styles.swatch, { backgroundColor: swatch }]} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>
            <Trans
              i18nKey='confirmBody'
              values={{ name: colorName }}
              components={{ b: <Text style={styles.bold} /> }}
            />
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              testID='confirm-cancel-btn'
              style={[styles.btn, styles.btnGhost]}
              onPress={onCancel}
              disabled={busy}
              accessibilityLabel={cancelLabel}
            >
              <Text style={styles.btnGhostText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID='confirm-delete-btn'
              style={[styles.btn, styles.btnDanger, busy && styles.btnDisabled]}
              onPress={onConfirm}
              disabled={busy}
              accessibilityLabel={confirmLabel}
            >
              <Text style={styles.btnDangerText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: 12
  },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 4
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center'
  },
  body: {
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    lineHeight: 22
  },
  bold: {
    fontWeight: '700',
    color: '#111'
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  btnGhost: {
    backgroundColor: '#f0f0f0'
  },
  btnGhostText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 15
  },
  btnDanger: {
    backgroundColor: '#e74c3c'
  },
  btnDangerText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15
  },
  btnDisabled: {
    opacity: 0.5
  }
})
