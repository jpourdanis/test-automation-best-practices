import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { ColorPickerModal } from './ColorPickerModal'

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (options?.name) return `${key} ${options.name}`
      return key
    }
  })
}))

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => children
}))

// Mock slider
jest.mock('@react-native-community/slider', () => 'Slider')

describe('ColorPickerModal', () => {
  const defaultProps = {
    visible: true,
    existingNames: ['Red', 'Blue'],
    saving: false,
    serverError: null,
    onClearError: jest.fn(),
    onConfirm: jest.fn(),
    onCancel: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly when visible', () => {
    const { getByTestId, getByPlaceholderText } = render(<ColorPickerModal {...defaultProps} />)

    expect(getByTestId('color-preview')).toBeTruthy()
    expect(getByPlaceholderText('colorPicker.namePlaceholder')).toBeTruthy()
    expect(getByTestId('slider-hue')).toBeTruthy()
    expect(getByTestId('slider-saturation')).toBeTruthy()
    expect(getByTestId('slider-lightness')).toBeTruthy()
  })

  it('calls onCancel when cancel button is pressed', () => {
    const { getByTestId } = render(<ColorPickerModal {...defaultProps} />)
    fireEvent.press(getByTestId('picker-cancel-btn'))
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
  })

  it('shows error and does not call onConfirm when name is empty', () => {
    const { getByTestId, getByText } = render(<ColorPickerModal {...defaultProps} />)
    fireEvent.press(getByTestId('picker-save-btn'))

    expect(getByText('colorPicker.errors.nameRequired')).toBeTruthy()
    expect(defaultProps.onConfirm).not.toHaveBeenCalled()
  })

  it('shows error and does not call onConfirm when name is duplicate', () => {
    const { getByTestId, getByPlaceholderText, getByText } = render(<ColorPickerModal {...defaultProps} />)

    fireEvent.changeText(getByPlaceholderText('colorPicker.namePlaceholder'), 'Red')
    fireEvent.press(getByTestId('picker-save-btn'))

    expect(getByText('colorPicker.errors.nameDuplicate Red')).toBeTruthy()
    expect(defaultProps.onConfirm).not.toHaveBeenCalled()
  })

  it('calls onConfirm with name and hex when valid', () => {
    const { getByTestId, getByPlaceholderText } = render(<ColorPickerModal {...defaultProps} />)

    fireEvent.changeText(getByPlaceholderText('colorPicker.namePlaceholder'), 'Green')
    fireEvent.press(getByTestId('picker-save-btn'))

    expect(defaultProps.onConfirm).toHaveBeenCalledWith({
      name: 'Green',
      hex: expect.stringMatching(/^#[0-9a-fA-F]{6}$/)
    })
  })

  it('shows server error when provided', () => {
    const { getByText } = render(<ColorPickerModal {...defaultProps} serverError='Server says no' />)
    expect(getByText('Server says no')).toBeTruthy()
  })

  it('calls onClearError when name input changes', () => {
    const { getByPlaceholderText } = render(<ColorPickerModal {...defaultProps} />)
    fireEvent.changeText(getByPlaceholderText('colorPicker.namePlaceholder'), 'G')
    expect(defaultProps.onClearError).toHaveBeenCalledTimes(1)
  })

  it('disables buttons and shows saving state when saving is true', () => {
    const { getByTestId, getByText } = render(<ColorPickerModal {...defaultProps} saving={true} />)

    const cancelBtn = getByTestId('picker-cancel-btn')
    const saveBtn = getByTestId('picker-save-btn')

    expect(cancelBtn.props.accessibilityState?.disabled || cancelBtn.props.disabled).toBe(true)
    expect(saveBtn.props.accessibilityState?.disabled || saveBtn.props.disabled).toBe(true)
    expect(getByText('colorPicker.saving')).toBeTruthy()
  })

  it('resets state when modal becomes hidden', () => {
    const { rerender, getByPlaceholderText } = render(<ColorPickerModal {...defaultProps} />)

    fireEvent.changeText(getByPlaceholderText('colorPicker.namePlaceholder'), 'Some Name')
    expect(getByPlaceholderText('colorPicker.namePlaceholder').props.value).toBe('Some Name')

    rerender(<ColorPickerModal {...defaultProps} visible={false} />)
    rerender(<ColorPickerModal {...defaultProps} visible={true} />)

    expect(getByPlaceholderText('colorPicker.namePlaceholder').props.value).toBe('')
  })
})
