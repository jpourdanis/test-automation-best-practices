import React, { useEffect } from 'react'

export interface ConfirmDialogProps {
  title: string
  body: React.ReactNode
  swatch: string
  confirmLabel: string
  cancelLabel: string
  busy: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  body,
  swatch,
  confirmLabel,
  cancelLabel,
  busy,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel()
      if (e.key === 'Enter' && !busy) onConfirm()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onConfirm, onCancel])

  return (
    <div className='picker-backdrop' onClick={() => !busy && onCancel()}>
      <div
        className='confirm-card'
        role='alertdialog'
        aria-modal='true'
        aria-labelledby='confirm-title'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='confirm-icon' style={{ background: swatch }} aria-hidden='true' />
        <h2 id='confirm-title'>{title}</h2>
        <p className='confirm-body'>{body}</p>
        <div className='picker-actions'>
          <button className='btn-ghost' onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button className='btn-danger' onClick={onConfirm} disabled={busy}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
