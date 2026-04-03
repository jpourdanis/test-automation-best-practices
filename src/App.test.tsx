import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App'

// Mock fetch globally
;(global as any).fetch = jest.fn()
const mockFetch = (global as any).fetch as jest.Mock

// Import en translations for precision
const en: any = {
  title: 'Color Chooser App',
  instructions: 'Edit <code>src/App.js</code> and save to reload.',
  learnReact: 'Learn React',
  currentColor: 'Current color:',
  colors: {
    turquoise: 'Turquoise',
    red: 'Red',
    yellow: 'Yellow',
    emerald: 'Emerald'
  },
  languageSelector: 'Select Language',
  changeColor: 'Change background to'
}

const mockChangeLanguage = jest.fn()

// Mock react-i18next with realistic translation behavior
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const keys = key.split('.')
      let result: any = en
      for (const k of keys) {
        if (result && result[k]) result = result[k]
        else return key // fallback to key
      }
      return typeof result === 'string' ? result : key
    },
    i18n: {
      changeLanguage: mockChangeLanguage,
      resolvedLanguage: 'en'
    }
  }),
  Trans: ({ i18nKey, children }: any) => {
    if (i18nKey === 'instructions') {
      return (
        <span>
          Edit <code>src/App.js</code> and save to reload.
        </span>
      )
    }
    return children
  },
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn()
  }
}))

describe('Frontend Unit Tests', () => {
  describe('App Component', () => {
    beforeEach(() => {
      mockFetch.mockReset()
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => []
      })
      jest.spyOn(console, 'error').mockImplementation(() => {})
      mockChangeLanguage.mockClear()
    })

    afterEach(() => {
      ;(console.error as jest.Mock).mockRestore()
    })

    test('renders title and logo with exact strings', async () => {
      render(<App />)
      expect(screen.getByText('Color Chooser App')).toBeInTheDocument()
      expect(screen.getByAltText('logo')).toHaveAttribute('src', 'logo.svg')
      expect(global.fetch).toHaveBeenCalledWith('/api/colors')
    })

    test('learn react link has exact text', async () => {
      render(<App />)
      const link = screen.getByRole('link', { name: 'Learn React' })
      expect(link.textContent).toBe('Learn React')
    })

    test('fetches and displays colors with exact aria-labels', async () => {
      const mockColors = [
        { name: 'Turquoise', hex: '#1abc9c' },
        { name: 'Red', hex: '#e74c3c' }
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockColors
      })

      render(<App />)

      const turquoiseButton = await screen.findByRole('button', {
        name: 'Change background to Turquoise'
      })
      const redButton = await screen.findByRole('button', { name: 'Change background to Red' })

      expect(turquoiseButton).toHaveTextContent('Turquoise')
      expect(redButton).toHaveTextContent('Red')
      expect(turquoiseButton).toHaveAttribute('aria-label', 'Change background to Turquoise')
    })

    test('changes background color and checks exact fetch URL', async () => {
      const mockColors = [
        { name: 'Emerald', hex: '#2ecc71' },
        { name: 'Red', hex: '#e74c3c' }
      ]
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockColors
      })

      const { container } = render(<App />)
      const redButton = await screen.findByRole('button', { name: 'Change background to Red' })

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'Red', hex: '#e74c3c' })
      })

      fireEvent.click(redButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/colors/Red', { cache: 'no-store' })
        const header = container.querySelector('.App-header')
        expect(header).toHaveStyle('background-color: rgb(231, 76, 60)')
      })
    })

    test('handles fetch reject with exact error message', async () => {
      const error = new Error('Network fail')
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(error)

      render(<App />)
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Failed to fetch colors:', error)
      })
    })

    test('handleColorClick handles fetch rejection and logs exact message', async () => {
      const mockColors = [{ name: 'Red', hex: '#ff0000' }]
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockColors
      })

      render(<App />)
      const redButton = await screen.findByRole('button', { name: 'Change background to Red' })

      const error = new Error('Update failed')
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(error)

      fireEvent.click(redButton)
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Failed to fetch hex for Red', error)
      })
    })

    test('handles null data or non-array from initial fetch and stays default', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => null })
      const { container } = render(<App />)
      await new Promise((r) => setTimeout(r, 50))
      const header = container.querySelector('.App-header')
      expect(header).toHaveStyle('background-color: rgb(26, 188, 156)')
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    test('handles empty array data from initial fetch and stays default', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [] })
      const { container } = render(<App />)
      await new Promise((r) => setTimeout(r, 50))
      const header = container.querySelector('.App-header')
      expect(header).toHaveStyle('background-color: rgb(26, 188, 156)')

      expect(screen.getByText('Loading colors...')).toBeInTheDocument()
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    test('useEffect only runs once on initial render and not on re-render', async () => {
      const { rerender } = render(<App />)
      const initialCalls = (global.fetch as jest.Mock).mock.calls.length

      // Trigger re-render by changing language
      const selector = screen.getByLabelText('Select Language')
      fireEvent.change(selector, { target: { value: 'es' } })

      expect(global.fetch).toHaveBeenCalledTimes(initialCalls)

      rerender(<App />)
      expect(global.fetch).toHaveBeenCalledTimes(initialCalls)
    })

    test('changes language and updates document', async () => {
      render(<App />)
      const selector = screen.getByLabelText('Select Language')
      fireEvent.change(selector, { target: { value: 'es' } })
      expect(mockChangeLanguage).toHaveBeenCalledWith('es')
      expect(document.documentElement.lang).toBe('es')
    })

    test('handleColorClick does nothing if hex is missing (kills Line 34 mutants)', async () => {
      const mockColors = [{ name: 'Emerald', hex: '#2ecc71' }]
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockColors
      })

      const { container } = render(<App />)
      const emeraldButton = await screen.findByRole('button', {
        name: 'Change background to Emerald'
      })

      // Background color should be emerald now (#2ecc71)
      await waitFor(() => {
        expect(container.querySelector('.App-header')).toHaveStyle('background-color: rgb(46, 204, 113)')
      })

      // Mock fetch returning data WITHOUT hex
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'Emerald' })
      })

      fireEvent.click(emeraldButton)
      await new Promise((r) => setTimeout(r, 50))

      // Should stay at emerald hex
      const header = container.querySelector('.App-header')
      expect(header).toHaveStyle('background-color: rgb(46, 204, 113)')
    })

    test('initial state and currentColor precise check', async () => {
      ;(global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}))
      const { container } = render(<App />)
      const header = container.querySelector('.App-header')
      expect(header).toHaveStyle('background-color: rgb(26, 188, 156)')

      const currentColorSpan = screen.getByText((content) => content.startsWith('Current color:'))
      expect(currentColorSpan).toHaveTextContent('Current color: #1abc9c')
    })

    test('handles non-array with length property from initial fetch', async () => {
      // Mutant 1: Array.isArray(data) && data.length > 0 -> Array.isArray(data) || data.length > 0
      // If we return { length: 1 }, original skips, mutant enters and throws.
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ length: 1 }) })
      render(<App />)
      await new Promise((r) => setTimeout(r, 50))
      // Original should not call console.error for "Failed to fetch colors" with the throw
      // Mutant would catch an error from data[0].hex
      expect(console.error).not.toHaveBeenCalled()
    })

    test('handles empty array data and ensures no errors are logged', async () => {
      // Mutants 2 & 3: data.length > 0 -> true or >= 0
      // If we return [], original skips, mutant enters and throws.
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [] })
      render(<App />)
      await new Promise((r) => setTimeout(r, 50))
      expect(console.error).not.toHaveBeenCalled()
    })

    test('useEffect does not re-run when unrelated props change', async () => {
      const { rerender } = render(<App />)
      const initialCalls = (global.fetch as jest.Mock).mock.calls.filter((c) => c[0] === '/api/colors').length

      // Rerender with new props
      rerender(<App {...({ someProp: 'new-value' } as any)} />)
      await new Promise((r) => setTimeout(r, 50))

      const followUpCalls = (global.fetch as jest.Mock).mock.calls.filter((c) => c[0] === '/api/colors').length
      expect(followUpCalls).toBe(initialCalls)
    })

    test('handleColorClick does nothing if data is null', async () => {
      const mockColors = [{ name: 'Emerald', hex: '#2ecc71' }]
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockColors })
      render(<App />)
      const button = await screen.findByRole('button')

      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => null })
      fireEvent.click(button)
      await new Promise((r) => setTimeout(r, 50))

      expect(console.error).not.toHaveBeenCalledWith(expect.stringContaining('Failed to fetch hex'), expect.anything())
    })

    test('handles initial fetch with ok: false (non-200 status)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      render(<App />)

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Failed to fetch colors:',
          expect.objectContaining({ message: expect.stringContaining('HTTP error! status: 500') })
        )
        expect(screen.getByRole('alert')).toHaveTextContent('Failed to load colors')
      })
    })

    test('handleColorClick handles ok: false (non-200 status) and shows specific error', async () => {
      const mockColors = [{ name: 'Red', hex: '#ff0000' }]
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockColors })

      render(<App />)
      const redButton = await screen.findByRole('button', { name: 'Change background to Red' })

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      })

      fireEvent.click(redButton)

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Failed to fetch hex for Red',
          expect.objectContaining({ message: expect.stringContaining('HTTP error! status: 404') })
        )
        expect(screen.getByRole('alert')).toHaveTextContent('Failed to load color: Red')
      })
    })

    test('clears previous error on new successful handleColorClick', async () => {
      const mockColors = [{ name: 'Red', hex: '#ff0000' }]
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockColors })

      render(<App />)
      const redButton = await screen.findByRole('button', { name: 'Change background to Red' })

      // 1. Trigger error
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })
      fireEvent.click(redButton)
      await screen.findByRole('alert')

      // 2. Trigger success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'Red', hex: '#00ff00' })
      })
      fireEvent.click(redButton)

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })
  })
})
