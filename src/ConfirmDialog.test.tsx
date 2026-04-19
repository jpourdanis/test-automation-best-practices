import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmDialog } from './ConfirmDialog'

function makeProps(overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  return {
    title: 'Delete color?',
    body: 'Are you sure you want to delete Red?',
    swatch: '#e74c3c',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    busy: false,
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
    ...overrides
  }
}

describe('Component Tests', () => {
  describe('ConfirmDialog', () => {
    test('renders title, body, and both buttons', () => {
      render(<ConfirmDialog {...makeProps()} />)
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      expect(screen.getByText('Delete color?')).toBeInTheDocument()
      expect(screen.getByText('Are you sure you want to delete Red?')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    })

    test('swatch div has the correct background color', () => {
      render(<ConfirmDialog {...makeProps({ swatch: '#1abc9c' })} />)
      const swatch = document.querySelector('.confirm-icon') as HTMLElement
      expect(swatch.style.background).toBe('rgb(26, 188, 156)')
    })

    test('confirm button calls onConfirm', () => {
      const onConfirm = jest.fn()
      render(<ConfirmDialog {...makeProps({ onConfirm })} />)
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
      expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    test('cancel button calls onCancel', () => {
      const onCancel = jest.fn()
      render(<ConfirmDialog {...makeProps({ onCancel })} />)
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    test('Escape key calls onCancel when not busy', () => {
      const onCancel = jest.fn()
      render(<ConfirmDialog {...makeProps({ onCancel })} />)
      fireEvent.keyDown(globalThis as unknown as Window, { key: 'Escape' })
      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    test('Enter key calls onConfirm when not busy', () => {
      const onConfirm = jest.fn()
      render(<ConfirmDialog {...makeProps({ onConfirm })} />)
      fireEvent.keyDown(globalThis as unknown as Window, { key: 'Enter' })
      expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    test('Escape key does NOT call onCancel when busy', () => {
      const onCancel = jest.fn()
      render(<ConfirmDialog {...makeProps({ busy: true, onCancel })} />)
      fireEvent.keyDown(globalThis as unknown as Window, { key: 'Escape' })
      expect(onCancel).not.toHaveBeenCalled()
    })

    test('Enter key does NOT call onConfirm when busy', () => {
      const onConfirm = jest.fn()
      render(<ConfirmDialog {...makeProps({ busy: true, onConfirm })} />)
      fireEvent.keyDown(globalThis as unknown as Window, { key: 'Enter' })
      expect(onConfirm).not.toHaveBeenCalled()
    })

    test('backdrop click calls onCancel when not busy', () => {
      const onCancel = jest.fn()
      render(<ConfirmDialog {...makeProps({ onCancel })} />)
      fireEvent.click(document.querySelector('.picker-backdrop')!)
      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    test('backdrop click does NOT call onCancel when busy', () => {
      const onCancel = jest.fn()
      render(<ConfirmDialog {...makeProps({ busy: true, onCancel })} />)
      fireEvent.click(document.querySelector('.picker-backdrop')!)
      expect(onCancel).not.toHaveBeenCalled()
    })

    test('clicking the card itself does NOT call onCancel', () => {
      const onCancel = jest.fn()
      render(<ConfirmDialog {...makeProps({ onCancel })} />)
      fireEvent.click(screen.getByRole('alertdialog'))
      expect(onCancel).not.toHaveBeenCalled()
    })

    test('both buttons are disabled when busy=true', () => {
      render(<ConfirmDialog {...makeProps({ busy: true, confirmLabel: 'Deleting\u2026' })} />)
      expect(screen.getByRole('button', { name: 'Deleting\u2026' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    })

    test('confirmLabel prop is reflected in the button text', () => {
      render(<ConfirmDialog {...makeProps({ confirmLabel: 'Deleting\u2026' })} />)
      expect(screen.getByRole('button', { name: 'Deleting\u2026' })).toBeInTheDocument()
    })

    test('cancelLabel prop is reflected in the button text', () => {
      render(<ConfirmDialog {...makeProps({ cancelLabel: 'No thanks' })} />)
      expect(screen.getByRole('button', { name: 'No thanks' })).toBeInTheDocument()
    })

    test('dialog has correct ARIA attributes', () => {
      render(<ConfirmDialog {...makeProps()} />)
      const dialog = screen.getByRole('alertdialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'confirm-title')
    })

    test('title is rendered in the element with id confirm-title', () => {
      render(<ConfirmDialog {...makeProps({ title: 'Really delete?' })} />)
      expect(document.getElementById('confirm-title')).toHaveTextContent('Really delete?')
    })
  })
})
