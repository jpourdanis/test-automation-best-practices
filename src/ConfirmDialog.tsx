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
}: Readonly<ConfirmDialogProps>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel()
      if (e.key === 'Enter' && !busy) onConfirm()
    }
    globalThis.addEventListener('keydown', onKey)
    return () => globalThis.removeEventListener('keydown', onKey)
  }, [busy, onConfirm, onCancel])

  return (
    <button
      className='picker-backdrop'
      aria-label='Close dialog'
      onClick={(e) => e.target === e.currentTarget && !busy && onCancel()}
      disabled={busy}
    >
      <div className='confirm-card' role='alertdialog' aria-modal='true' aria-labelledby='confirm-title' tabIndex={-1}>
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
    </button>
  )
}
