import React from 'react'
import { render, fireEvent, act } from '@testing-library/react-native'
import ColorPickerInner from './ColorPickerInner'

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (options?.name) return `${key} ${options.name}`
      return key
    }
  })
}))

// Mock reanimated-color-picker
jest.mock('reanimated-color-picker', () => {
  const React = require('react')
  const { TouchableOpacity } = require('react-native')
  return {
    __esModule: true,
    default: ({ children, onComplete }: any) => {
      return (
        <React.Fragment>
          {children}
          <TouchableOpacity testID='mock-trigger-complete' onPress={() => onComplete({ hex: '#00ff00' })} />
        </React.Fragment>
      )
    },
    Panel3: 'Panel3',
    LuminanceSlider: 'LuminanceSlider',
    Preview: 'Preview'
  }
})

// Mock gesture handler
jest.mock('react-native-gesture-handler', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    GestureHandlerRootView: ({ children }: any) => <View>{children}</View>
  }
})

describe('ColorPickerInner', () => {
  const defaultProps = {
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

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(<ColorPickerInner {...defaultProps} />)
    expect(getByText('colorPicker.title')).toBeTruthy()
    expect(getByPlaceholderText('colorPicker.namePlaceholder')).toBeTruthy()
  })

  it('updates hex when picker completes', () => {
    const { getByTestId } = render(<ColorPickerInner {...defaultProps} />)

    act(() => {
      fireEvent.press(getByTestId('mock-trigger-complete'))
    })

    const hexInput = getByTestId('hex-input')
    expect(hexInput.props.value).toBe('#00ff00')
  })

  it('validates name and calls onConfirm', () => {
    const { getByText, getByPlaceholderText } = render(<ColorPickerInner {...defaultProps} />)

    fireEvent.changeText(getByPlaceholderText('colorPicker.namePlaceholder'), 'Green')
    fireEvent.press(getByText('colorPicker.addColor'))

    expect(defaultProps.onConfirm).toHaveBeenCalledWith({
      name: 'Green',
      hex: '#3478f6' // Initial hex
    })
  })

  it('shows error for empty name', () => {
    const { getByText } = render(<ColorPickerInner {...defaultProps} />)
    fireEvent.press(getByText('colorPicker.addColor'))
    expect(getByText('colorPicker.errors.nameRequired')).toBeTruthy()
  })

  it('shows error for duplicate name', () => {
    const { getByText, getByPlaceholderText } = render(<ColorPickerInner {...defaultProps} />)
    fireEvent.changeText(getByPlaceholderText('colorPicker.namePlaceholder'), 'Red')
    fireEvent.press(getByText('colorPicker.addColor'))
    expect(getByText('colorPicker.errors.nameDuplicate Red')).toBeTruthy()
  })

  it('shows error for invalid name characters', () => {
    const { getByText, getByPlaceholderText } = render(<ColorPickerInner {...defaultProps} />)
    fireEvent.changeText(getByPlaceholderText('colorPicker.namePlaceholder'), '!!!')
    fireEvent.press(getByText('colorPicker.addColor'))
    expect(getByText('colorPicker.errors.nameInvalid')).toBeTruthy()
  })

  it('updates hex via manual input', () => {
    const { getByDisplayValue } = render(<ColorPickerInner {...defaultProps} />)
    const hexInput = getByDisplayValue('#3478f6')

    fireEvent.changeText(hexInput, '#ff0000')
    expect(getByDisplayValue('#ff0000')).toBeTruthy()
  })

  it('shows error for invalid hex format', () => {
    const { getByDisplayValue, getByText } = render(<ColorPickerInner {...defaultProps} />)
    const hexInput = getByDisplayValue('#3478f6')

    fireEvent.changeText(hexInput, 'invalid')
    expect(getByText('colorPicker.errors.hexFormat')).toBeTruthy()
  })

  it('calls onCancel when close button is pressed', () => {
    const { getByText } = render(<ColorPickerInner {...defaultProps} />)
    fireEvent.press(getByText('×'))
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onClearError when name changes and serverError exists', () => {
    // It's called twice: once on mount (since serverError is present) and once on change
    const { getByPlaceholderText } = render(<ColorPickerInner {...defaultProps} serverError='Err' />)
    fireEvent.changeText(getByPlaceholderText('colorPicker.namePlaceholder'), 'X')
    expect(defaultProps.onClearError).toHaveBeenCalledTimes(2)
  })
})
