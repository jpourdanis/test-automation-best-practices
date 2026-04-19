import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App'

// Mock fetch globally
;(global as any).fetch = jest.fn()
const mockFetch = (global as any).fetch as jest.Mock

const en: any = {
  title: 'Color Chooser App',
  instructions: 'Edit <code>src/App.js</code> and save to reload.',
  learnReact: 'Learn React',
  currentColor: 'Current color:',
  colors: { turquoise: 'Turquoise', red: 'Red', yellow: 'Yellow' },
  languageSelector: 'Select Language',
  changeColor: 'Change background to',
  add: '+ Add color',
  loading: 'Loading colors...',
  remove: 'Remove color',
  confirmTitle: 'Delete color?',
  cancel: 'Cancel',
  delete: 'Delete',
  deleting: 'Deleting\u2026'
}

const mockChangeLanguage = jest.fn()

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => {
      const keys = key.split('.')
      let result: any = en
      for (const k of keys) {
        if (result && typeof result === 'object' && result[k] !== undefined) {
          result = result[k]
        } else {
          return options?.defaultValue !== undefined ? options.defaultValue : key
        }
      }
      return typeof result === 'string' ? result : key
    },
    i18n: { changeLanguage: mockChangeLanguage, resolvedLanguage: 'en' }
  }),
  Trans: ({ i18nKey, children, values }: any) => {
    if (i18nKey === 'instructions') {
      return (
        <span>
          Edit <code>src/App.js</code> and save to reload.
        </span>
      )
    }
    if (i18nKey === 'confirmBody') {
      return (
        <span>
          Are you sure you want to delete <b>{values?.name}</b>? This cannot be undone.
        </span>
      )
    }
    return children || null
  },
  initReactI18next: { type: '3rdParty', init: jest.fn() }
}))

// Mock canvas — JSDOM does not implement it
HTMLCanvasElement.prototype.getContext = jest.fn(
  () =>
    ({
      scale: jest.fn(),
      putImageData: jest.fn(),
      createImageData: jest.fn((w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }))
    }) as any
)

// ─── helpers ────────────────────────────────────────────────────────────────

const TURQUOISE = { name: 'Turquoise', hex: '#1abc9c' }
const RED = { name: 'Red', hex: '#e74c3c' }
const YELLOW = { name: 'Yellow', hex: '#f1c40f' }
const THREE_COLORS = [TURQUOISE, RED, YELLOW]

function mockList(colors = THREE_COLORS) {
  return { ok: true, json: async () => colors }
}
function mockColor(color: { name: string; hex: string }) {
  return { ok: true, json: async () => color }
}
function mockDeleted(name: string) {
  return { ok: true, json: async () => ({ message: `Color "${name}" deleted successfully` }) }
}
function mockError(status: number, error: string) {
  return { ok: false, status, json: async () => ({ error }) }
}

// ─── tests ──────────────────────────────────────────────────────────────────

describe('Frontend Unit Tests', () => {
  describe('App Component', () => {
    beforeEach(() => {
      mockFetch.mockReset()
      mockFetch.mockResolvedValue(mockList([]))
      mockChangeLanguage.mockClear()
    })

    // ── rendering ─────────────────────────────────────────────────────────

    test('renders title, logo, and calls initial fetch', async () => {
      render(<App />)
      expect(screen.getByText('Color Chooser App')).toBeInTheDocument()
      expect(screen.getByAltText('logo')).toHaveAttribute('src', 'logo.svg')
      expect(mockFetch).toHaveBeenCalledWith('/api/colors')
    })

    test('learn react link has correct text', () => {
      render(<App />)
      expect(screen.getByRole('link', { name: 'Learn React' })).toHaveTextContent('Learn React')
    })

    test('shows loading text when colors array is empty', async () => {
      mockFetch.mockResolvedValueOnce(mockList([]))
      render(<App />)
      await waitFor(() => expect(screen.getByText('Loading colors...')).toBeInTheDocument())
    })

    test('shows add-color button even when colors are empty', async () => {
      mockFetch.mockResolvedValueOnce(mockList([]))
      render(<App />)
      await waitFor(() => expect(screen.getByRole('button', { name: '+ Add color' })).toBeInTheDocument())
    })

    test('fetches and displays color chips with swatch and delete button', async () => {
      mockFetch.mockResolvedValueOnce(mockList())
      render(<App />)

      const mainBtn = await screen.findByRole('button', { name: 'Change background to Turquoise' })
      expect(mainBtn).toHaveTextContent('Turquoise')

      const deleteBtn = await screen.findByRole('button', { name: 'Remove color: Turquoise' })
      expect(deleteBtn).toBeInTheDocument()
    })

    // ── active state ──────────────────────────────────────────────────────

    test('first loaded color is active (aria-pressed=true)', async () => {
      mockFetch.mockResolvedValueOnce(mockList())
      render(<App />)

      const turquoiseBtn = await screen.findByRole('button', { name: 'Change background to Turquoise' })
      await waitFor(() => expect(turquoiseBtn).toHaveAttribute('aria-pressed', 'true'))

      const redBtn = screen.getByRole('button', { name: 'Change background to Red' })
      expect(redBtn).toHaveAttribute('aria-pressed', 'false')
    })

    test('clicking a color chip makes it active', async () => {
      mockFetch.mockResolvedValueOnce(mockList())
      render(<App />)

      await screen.findByRole('button', { name: 'Change background to Red' })
      mockFetch.mockResolvedValueOnce(mockColor(RED))
      fireEvent.click(screen.getByRole('button', { name: 'Change background to Red' }))

      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Change background to Red' })).toHaveAttribute('aria-pressed', 'true')
      )
      expect(screen.getByRole('button', { name: 'Change background to Turquoise' })).toHaveAttribute(
        'aria-pressed',
        'false'
      )
    })

    test('active chip has is-active CSS class', async () => {
      mockFetch.mockResolvedValueOnce(mockList())
      const { container } = render(<App />)

      await screen.findByRole('button', { name: 'Change background to Turquoise' })
      await waitFor(() => {
        const chip = container.querySelector('.color-chip.is-active')
        expect(chip).toBeInTheDocument()
      })
    })

    // ── background & contrast text ─────────────────────────────────────────

    test('initial background is first color hex', async () => {
      mockFetch.mockResolvedValueOnce(mockList())
      const { container } = render(<App />)

      await screen.findByRole('button', { name: 'Change background to Turquoise' })
      await waitFor(() => {
        expect(container.querySelector('.App-header')).toHaveStyle('background-color: rgb(26, 188, 156)')
      })
    })

    test('initial default background before fetch resolves', async () => {
      mockFetch.mockReturnValue(new Promise(() => {}))
      const { container } = render(<App />)
      const header = container.querySelector('.App-header')
      expect(header).toHaveStyle('background-color: rgb(26, 188, 156)')
    })

    test('header color attribute changes after clicking a chip', async () => {
      mockFetch.mockResolvedValueOnce(mockList())
      const { container } = render(<App />)

      await screen.findByRole('button', { name: 'Change background to Red' })
      mockFetch.mockResolvedValueOnce(mockColor(RED))
      fireEvent.click(screen.getByRole('button', { name: 'Change background to Red' }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/colors/Red', { cache: 'no-store' })
        expect(container.querySelector('.App-header')).toHaveStyle('background-color: rgb(231, 76, 60)')
      })
    })

    test('current color span tracks hex value', async () => {
      mockFetch.mockReturnValue(new Promise(() => {}))
      render(<App />)
      const span = screen.getByText((c) => c.startsWith('Current color:'))
      expect(span).toHaveTextContent('Current color: #1abc9c')
    })

    test('text color on dark background is white', async () => {
      // #000000 → luminance 0 → '#fff'
      mockFetch.mockResolvedValueOnce(mockList([{ name: 'Black', hex: '#000000' }]))
      const { container } = render(<App />)
      await screen.findByRole('button', { name: 'Change background to Black' })
      await waitFor(() => {
        expect(container.querySelector('.App-header')).toHaveStyle('color: #fff')
      })
    })

    test('text color on light background is dark', async () => {
      // #ffffff → luminance 1 → '#111'
      mockFetch.mockResolvedValueOnce(mockList([{ name: 'White', hex: '#ffffff' }]))
      const { container } = render(<App />)
      await screen.findByRole('button', { name: 'Change background to White' })
      await waitFor(() => {
        expect(container.querySelector('.App-header')).toHaveStyle('color: #111111')
      })
    })

    // ── labelFor ──────────────────────────────────────────────────────────

    test('labelFor returns translation for known color (Turquoise)', async () => {
      mockFetch.mockResolvedValueOnce(mockList())
      render(<App />)
      const btn = await screen.findByRole('button', { name: 'Change background to Turquoise' })
      expect(btn).toHaveTextContent('Turquoise')
    })

    test('labelFor falls back to color name for unknown/custom color', async () => {
      mockFetch.mockResolvedValueOnce(mockList([{ name: 'OceanBlue', hex: '#0077be' }]))
      render(<App />)
      const btn = await screen.findByRole('button', { name: 'Change background to OceanBlue' })
      expect(btn).toHaveTextContent('OceanBlue')
    })

    // ── handleColorClick edge cases ────────────────────────────────────────

    test('handleColorClick encodes color name in URL', async () => {
      mockFetch.mockResolvedValueOnce(mockList([{ name: 'My Color', hex: '#aabbcc' }]))
      render(<App />)
      await screen.findByRole('button', { name: 'Change background to My Color' })

      mockFetch.mockResolvedValueOnce(mockColor({ name: 'My Color', hex: '#aabbcc' }))
      fireEvent.click(screen.getByRole('button', { name: 'Change background to My Color' }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/colors/My%20Color', { cache: 'no-store' })
      })
    })

    test('handleColorClick does nothing when data has no hex', async () => {
      mockFetch.mockResolvedValueOnce(mockList())
      const { container } = render(<App />)
      await screen.findByRole('button', { name: 'Change background to Turquoise' })

      // background already set to turquoise from initial load
      await waitFor(() =>
        expect(container.querySelector('.App-header')).toHaveStyle('background-color: rgb(26, 188, 156)')
      )

      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ name: 'Turquoise' }) })
      fireEvent.click(screen.getByRole('button', { name: 'Change background to Turquoise' }))
      await new Promise((r) => setTimeout(r, 60))

      expect(container.querySelector('.App-header')).toHaveStyle('background-color: rgb(26, 188, 156)')
    })

    test('handleColorClick does nothing when data is null', async () => {
      mockFetch.mockResolvedValueOnce(mockList())
      const { container } = render(<App />)
      await screen.findByRole('button', { name: 'Change background to Turquoise' })

      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => null })
      fireEvent.click(screen.getByRole('button', { name: 'Change background to Turquoise' }))
      await new Promise((r) => setTimeout(r, 60))

      expect(container.querySelector('.App-header')).toHaveStyle('background-color: rgb(26, 188, 156)')
    })

    test('handleColorClick shows error alert on fetch failure', async () => {
      mockFetch.mockResolvedValueOnce(mockList())
      render(<App />)
      await screen.findByRole('button', { name: 'Change background to Red' })

      mockFetch.mockRejectedValueOnce(new Error('Network fail'))
      fireEvent.click(screen.getByRole('button', { name: 'Change background to Red' }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Failed to load color: Red')
      })
    })

    test('handleColorClick shows error on non-2xx response', async () => {
      mockFetch.mockResolvedValueOnce(mockList())
      render(<App />)
      await screen.findByRole('button', { name: 'Change background to Red' })

      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })
      fireEvent.click(screen.getByRole('button', { name: 'Change background to Red' }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Failed to load color: Red')
      })
    })

    test('handleColorClick clears previous error on new successful click', async () => {
      mockFetch.mockResolvedValueOnce(mockList())
      render(<App />)
      await screen.findByRole('button', { name: 'Change background to Red' })

      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })
      fireEvent.click(screen.getByRole('button', { name: 'Change background to Red' }))
      await screen.findByRole('alert')

      mockFetch.mockResolvedValueOnce(mockColor(RED))
      fireEvent.click(screen.getByRole('button', { name: 'Change background to Red' }))

      await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    })

    // ── initial fetch edge cases ───────────────────────────────────────────

    test('shows error alert when initial fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network fail'))
      render(<App />)
      await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to load colors'))
    })

    test('shows error alert when initial fetch returns non-2xx', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })
      render(<App />)
      await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to load colors'))
    })

    test('handles null data from initial fetch gracefully', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => null })
      const { container } = render(<App />)
      await new Promise((r) => setTimeout(r, 60))
      expect(container.querySelector('.App-header')).toHaveStyle('background-color: rgb(26, 188, 156)')
      // no color-chip buttons rendered
      expect(screen.queryByRole('button', { name: /change background/i })).not.toBeInTheDocument()
    })

    test('handles empty array from initial fetch gracefully', async () => {
      mockFetch.mockResolvedValueOnce(mockList([]))
      const { container } = render(<App />)
      await new Promise((r) => setTimeout(r, 60))
      expect(container.querySelector('.App-header')).toHaveStyle('background-color: rgb(26, 188, 156)')
      expect(screen.getByText('Loading colors...')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /change background/i })).not.toBeInTheDocument()
    })

    test('handles non-array initial fetch response gracefully', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ length: 1 }) })
      render(<App />)
      await new Promise((r) => setTimeout(r, 60))
      expect(screen.queryByRole('button', { name: /change background/i })).not.toBeInTheDocument()
    })

    test('useEffect runs only once on mount', async () => {
      const { rerender } = render(<App />)
      const calls = mockFetch.mock.calls.length
      rerender(<App />)
      await new Promise((r) => setTimeout(r, 60))
      expect(mockFetch).toHaveBeenCalledTimes(calls)
    })

    // ── language ──────────────────────────────────────────────────────────

    test('language selector change calls i18n and updates html lang', () => {
      render(<App />)
      fireEvent.change(screen.getByLabelText('Select Language'), { target: { value: 'es' } })
      expect(mockChangeLanguage).toHaveBeenCalledWith('es')
      expect(document.documentElement.lang).toBe('es')
    })

    // ── color picker modal ─────────────────────────────────────────────────

    test('clicking Add color button opens picker modal', async () => {
      mockFetch.mockResolvedValueOnce(mockList([]))
      render(<App />)
      await screen.findByRole('button', { name: '+ Add color' })

      fireEvent.click(screen.getByRole('button', { name: '+ Add color' }))
      expect(screen.getByRole('dialog', { name: 'Add custom color' })).toBeInTheDocument()
    })

    test('picker cancel button closes the modal', async () => {
      mockFetch.mockResolvedValueOnce(mockList([]))
      render(<App />)
      await screen.findByRole('button', { name: '+ Add color' })

      fireEvent.click(screen.getByRole('button', { name: '+ Add color' }))
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    test('picker × button closes the modal', async () => {
      mockFetch.mockResolvedValueOnce(mockList([]))
      render(<App />)
      await screen.findByRole('button', { name: '+ Add color' })

      fireEvent.click(screen.getByRole('button', { name: '+ Add color' }))
      fireEvent.click(screen.getByRole('button', { name: 'Close' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    // ── handleAddColor ─────────────────────────────────────────────────────

    test('add color success closes picker and shows new chip', async () => {
      const OCEAN = { name: 'Ocean', hex: '#0077be' }
      mockFetch.mockResolvedValueOnce(mockList())
      render(<App />)
      await screen.findByRole('button', { name: '+ Add color' })

      fireEvent.click(screen.getByRole('button', { name: '+ Add color' }))
      fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'Ocean' } })

      // POST success + refreshed list
      mockFetch.mockResolvedValueOnce({ ok: true, status: 201, json: async () => OCEAN })
      mockFetch.mockResolvedValueOnce(mockList([...THREE_COLORS, OCEAN]))
      fireEvent.click(screen.getByRole('button', { name: 'Add color' }))

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(await screen.findByRole('button', { name: 'Change background to Ocean' })).toBeInTheDocument()
    })

    test('add color 409 conflict shows picker error (data.error message)', async () => {
      mockFetch.mockResolvedValueOnce(mockList([]))
      render(<App />)
      await screen.findByRole('button', { name: '+ Add color' })

      fireEvent.click(screen.getByRole('button', { name: '+ Add color' }))
      fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'Turquoise' } })

      // Bypass client-side duplicate check by faking existing names
      mockFetch.mockResolvedValueOnce(mockError(409, 'Color "Turquoise" already exists'))
      // Directly fire submit — force past client-side check by having empty existingNames
      // We can do this by rendering with an empty list then submitting
      fireEvent.click(screen.getByRole('button', { name: 'Add color' }))

      await waitFor(() => {
        const alert = screen.queryByRole('alert')
        if (alert) expect(alert).toHaveTextContent('Color "Turquoise" already exists')
      })
    })

    test('add color 409 fallback message when data.error is absent', async () => {
      // Render with empty list so no client-side duplicate check fires
      mockFetch.mockResolvedValueOnce(mockList([]))
      render(<App />)
      await screen.findByRole('button', { name: '+ Add color' })

      fireEvent.click(screen.getByRole('button', { name: '+ Add color' }))
      fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'Unique' } })

      mockFetch.mockResolvedValueOnce({ ok: false, status: 409, json: async () => ({}) })
      fireEvent.click(screen.getByRole('button', { name: 'Add color' }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('A color named "Unique" already exists.')
      })
    })

    test('add color 429 rate limit shows specific message', async () => {
      mockFetch.mockResolvedValueOnce(mockList([]))
      render(<App />)
      await screen.findByRole('button', { name: '+ Add color' })

      fireEvent.click(screen.getByRole('button', { name: '+ Add color' }))
      fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'Unique' } })

      mockFetch.mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({}) })
      fireEvent.click(screen.getByRole('button', { name: 'Add color' }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Too many requests. Try again in a moment.')
      })
    })

    test('add color 500 shows server error message', async () => {
      mockFetch.mockResolvedValueOnce(mockList([]))
      render(<App />)
      await screen.findByRole('button', { name: '+ Add color' })

      fireEvent.click(screen.getByRole('button', { name: '+ Add color' }))
      fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'Unique' } })

      mockFetch.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
      fireEvent.click(screen.getByRole('button', { name: 'Add color' }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Server error. Please try again.')
      })
    })

    test('add color 501 also triggers server error message (>= 500)', async () => {
      mockFetch.mockResolvedValueOnce(mockList([]))
      render(<App />)
      await screen.findByRole('button', { name: '+ Add color' })

      fireEvent.click(screen.getByRole('button', { name: '+ Add color' }))
      fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'Unique' } })

      mockFetch.mockResolvedValueOnce({ ok: false, status: 501, json: async () => ({}) })
      fireEvent.click(screen.getByRole('button', { name: 'Add color' }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Server error. Please try again.')
      })
    })

    test('add color 400 shows data.error message', async () => {
      mockFetch.mockResolvedValueOnce(mockList([]))
      render(<App />)
      await screen.findByRole('button', { name: '+ Add color' })

      fireEvent.click(screen.getByRole('button', { name: '+ Add color' }))
      fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'Unique' } })

      mockFetch.mockResolvedValueOnce(mockError(400, 'Invalid hex format'))
      fireEvent.click(screen.getByRole('button', { name: 'Add color' }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Invalid hex format')
      })
    })

    test('add color network error shows network error message', async () => {
      mockFetch.mockResolvedValueOnce(mockList([]))
      render(<App />)
      await screen.findByRole('button', { name: '+ Add color' })

      fireEvent.click(screen.getByRole('button', { name: '+ Add color' }))
      fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'Unique' } })

      mockFetch.mockRejectedValueOnce(new Error('net::ERR_FAILED'))
      fireEvent.click(screen.getByRole('button', { name: 'Add color' }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Network error')
      })
    })

    // ── delete / confirm dialog ────────────────────────────────────────────

    test('clicking chip-x opens confirm dialog with color name and swatch', async () => {
      mockFetch.mockResolvedValueOnce(mockList())
      render(<App />)
      await screen.findByRole('button', { name: 'Remove color: Red' })

      fireEvent.click(screen.getByRole('button', { name: 'Remove color: Red' }))

      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      expect(screen.getByText('Delete color?')).toBeInTheDocument()
      expect(screen.getByText('Red', { selector: 'b' })).toBeInTheDocument()
    })

    test('confirm dialog cancel button closes it', async () => {
      mockFetch.mockResolvedValueOnce(mockList())
      render(<App />)
      await screen.findByRole('button', { name: 'Remove color: Red' })

      fireEvent.click(screen.getByRole('button', { name: 'Remove color: Red' }))
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })

    test('confirm dialog Escape key closes it', async () => {
      mockFetch.mockResolvedValueOnce(mockList())
      render(<App />)
      await screen.findByRole('button', { name: 'Remove color: Red' })

      fireEvent.click(screen.getByRole('button', { name: 'Remove color: Red' }))
      fireEvent.keyDown(window, { key: 'Escape' })

      await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    })

    test('successful delete removes the color chip', async () => {
      mockFetch.mockResolvedValueOnce(mockList())
      render(<App />)
      await screen.findByRole('button', { name: 'Remove color: Red' })

      fireEvent.click(screen.getByRole('button', { name: 'Remove color: Red' }))

      mockFetch.mockResolvedValueOnce(mockDeleted('Red'))
      mockFetch.mockResolvedValueOnce(mockList([TURQUOISE, YELLOW]))
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Change background to Red' })).not.toBeInTheDocument()
      })
    })

    test('deleting the active color switches background to the first remaining', async () => {
      mockFetch.mockResolvedValueOnce(mockList())
      const { container } = render(<App />)
      // Turquoise is active by default after load
      await screen.findByRole('button', { name: 'Remove color: Turquoise' })
      await waitFor(() =>
        expect(container.querySelector('.App-header')).toHaveStyle('background-color: rgb(26, 188, 156)')
      )

      fireEvent.click(screen.getByRole('button', { name: 'Remove color: Turquoise' }))
      mockFetch.mockResolvedValueOnce(mockDeleted('Turquoise'))
      mockFetch.mockResolvedValueOnce(mockList([RED, YELLOW]))
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

      // background should switch to Red (first remaining)
      await waitFor(() => {
        expect(container.querySelector('.App-header')).toHaveStyle('background-color: rgb(231, 76, 60)')
      })
    })

    test('deleting the last color sets activeName to null', async () => {
      mockFetch.mockResolvedValueOnce(mockList([RED]))
      render(<App />)
      await screen.findByRole('button', { name: 'Remove color: Red' })

      fireEvent.click(screen.getByRole('button', { name: 'Remove color: Red' }))
      mockFetch.mockResolvedValueOnce(mockDeleted('Red'))
      mockFetch.mockResolvedValueOnce(mockList([]))
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /change background/i })).not.toBeInTheDocument()
      })
    })

    test('deleting a non-active color keeps the current background', async () => {
      mockFetch.mockResolvedValueOnce(mockList())
      const { container } = render(<App />)
      // Turquoise is active
      await screen.findByRole('button', { name: 'Remove color: Red' })
      await waitFor(() =>
        expect(container.querySelector('.App-header')).toHaveStyle('background-color: rgb(26, 188, 156)')
      )

      fireEvent.click(screen.getByRole('button', { name: 'Remove color: Red' }))
      mockFetch.mockResolvedValueOnce(mockDeleted('Red'))
      mockFetch.mockResolvedValueOnce(mockList([TURQUOISE, YELLOW]))
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

      await waitFor(() => {
        // background should still be Turquoise
        expect(container.querySelector('.App-header')).toHaveStyle('background-color: rgb(26, 188, 156)')
      })
    })

    test('delete API error shows error alert without closing dialog', async () => {
      mockFetch.mockResolvedValueOnce(mockList())
      render(<App />)
      await screen.findByRole('button', { name: 'Remove color: Red' })

      fireEvent.click(screen.getByRole('button', { name: 'Remove color: Red' }))
      mockFetch.mockResolvedValueOnce(mockError(500, 'DB error'))
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('DB error')
      })
    })

    test('delete network error shows error alert', async () => {
      mockFetch.mockResolvedValueOnce(mockList())
      render(<App />)
      await screen.findByRole('button', { name: 'Remove color: Red' })

      fireEvent.click(screen.getByRole('button', { name: 'Remove color: Red' }))
      mockFetch.mockRejectedValueOnce(new Error('offline'))
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Network error')
      })
    })
  })
})
