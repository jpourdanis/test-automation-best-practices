import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { ConfirmDialog } from './ConfirmDialog'

jest.mock('react-i18next', () => ({
  Trans: ({ i18nKey, values, components }: any) => {
    return (
      <>
        {i18nKey} {values?.name}
      </>
    )
  }
}))

describe('ConfirmDialog', () => {
  const defaultProps = {
    visible: true,
    title: 'Delete Color?',
    colorName: 'Red',
    swatch: '#ff0000',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    busy: false,
    onConfirm: jest.fn(),
    onCancel: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly when visible', () => {
    const { getByText } = render(<ConfirmDialog {...defaultProps} />)

    expect(getByText('Delete Color?')).toBeTruthy()
    expect(getByText('Delete')).toBeTruthy()
    expect(getByText('Cancel')).toBeTruthy()
    expect(getByText('confirmBody Red')).toBeTruthy()
  })

  it('does not render content when not visible', () => {
    const { queryByText } = render(<ConfirmDialog {...defaultProps} visible={false} />)
    // The Modal component might still render its children depending on the version,
    // but the Modal itself will have visible={false}.
    // We can check if the title is not visible if it's truly unmounted,
    // though React Native Modal behaves differently.
    // At least ensure it renders without crashing.
    expect(queryByText('Delete Color?')).toBeNull() // When visible is false, it shouldn't render
  })

  it('calls onCancel when cancel button is pressed', () => {
    const { getByTestId } = render(<ConfirmDialog {...defaultProps} />)

    fireEvent.press(getByTestId('confirm-cancel-btn'))
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
    expect(defaultProps.onConfirm).not.toHaveBeenCalled()
  })

  it('calls onConfirm when confirm button is pressed', () => {
    const { getByTestId } = render(<ConfirmDialog {...defaultProps} />)

    fireEvent.press(getByTestId('confirm-delete-btn'))
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1)
    expect(defaultProps.onCancel).not.toHaveBeenCalled()
  })

  it('disables buttons when busy is true', () => {
    const { getByTestId } = render(<ConfirmDialog {...defaultProps} busy={true} />)

    const cancelBtn = getByTestId('confirm-cancel-btn')
    const confirmBtn = getByTestId('confirm-delete-btn')

    const cancelDisabled = cancelBtn.props.accessibilityState?.disabled || cancelBtn.props.disabled
    const confirmDisabled = confirmBtn.props.accessibilityState?.disabled || confirmBtn.props.disabled

    expect(cancelDisabled).toBe(true)
    expect(confirmDisabled).toBe(true)
  })

  it('calls onCancel on onRequestClose (hardware back button) when not busy', () => {
    const { getByTestId } = render(<ConfirmDialog {...defaultProps} />)

    fireEvent(getByTestId('confirm-modal'), 'requestClose')
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
  })

  it('does not call onCancel on onRequestClose when busy', () => {
    const { getByTestId } = render(<ConfirmDialog {...defaultProps} busy={true} />)

    fireEvent(getByTestId('confirm-modal'), 'requestClose')
    expect(defaultProps.onCancel).not.toHaveBeenCalled()
  })
})
