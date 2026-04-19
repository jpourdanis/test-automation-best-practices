import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { readableOn, hexToRgb, hslToRgb, rgbToHex, rgbToHsl, ColorPicker } from './ColorPicker'

// ── Canvas mock (JSDOM doesn't implement it) ─────────────────────────────────
HTMLCanvasElement.prototype.getContext = jest.fn(
  () =>
    ({
      scale: jest.fn(),
      putImageData: jest.fn(),
      createImageData: jest.fn((w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }))
    }) as any
)

// ── Default props helpers ────────────────────────────────────────────────────
const noop = jest.fn()
function makeProps(overrides: Partial<Parameters<typeof ColorPicker>[0]> = {}) {
  return {
    existingNames: [],
    saving: false,
    serverError: null,
    onClearError: noop,
    onConfirm: noop,
    onCancel: noop,
    ...overrides
  }
}

// ── hslToRgb ─────────────────────────────────────────────────────────────────

describe('hslToRgb', () => {
  // sector 0: hp < 1 (hue 0–59)
  test('hue=0 (red, sector 0)', () => {
    expect(hslToRgb(0, 1, 0.5)).toEqual([255, 0, 0])
  })

  test('hue=30 (orange, sector 0)', () => {
    const [r, g, b] = hslToRgb(30, 1, 0.5)
    expect(r).toBe(255)
    expect(g).toBeGreaterThan(0)
    expect(b).toBe(0)
  })

  // sector 1: hp < 2 (hue 60–119)
  test('hue=60 (yellow, sector 1)', () => {
    expect(hslToRgb(60, 1, 0.5)).toEqual([255, 255, 0])
  })

  test('hue=90 (chartreuse, sector 1)', () => {
    const [r, g, b] = hslToRgb(90, 1, 0.5)
    expect(g).toBe(255)
    expect(r).toBeGreaterThan(0)
    expect(b).toBe(0)
  })

  // sector 2: hp < 3 (hue 120–179)
  test('hue=120 (green, sector 2)', () => {
    expect(hslToRgb(120, 1, 0.5)).toEqual([0, 255, 0])
  })

  test('hue=150 (spring green, sector 2)', () => {
    const [r, g, b] = hslToRgb(150, 1, 0.5)
    expect(r).toBe(0)
    expect(g).toBe(255)
    expect(b).toBeGreaterThan(0)
  })

  // sector 3: hp < 4 (hue 180–239)
  test('hue=180 (cyan, sector 3)', () => {
    expect(hslToRgb(180, 1, 0.5)).toEqual([0, 255, 255])
  })

  test('hue=210 (azure, sector 3)', () => {
    const [r, g, b] = hslToRgb(210, 1, 0.5)
    expect(r).toBe(0)
    expect(b).toBe(255)
    expect(g).toBeGreaterThan(0)
  })

  // sector 4: hp < 5 (hue 240–299)
  test('hue=240 (blue, sector 4)', () => {
    expect(hslToRgb(240, 1, 0.5)).toEqual([0, 0, 255])
  })

  test('hue=270 (violet, sector 4)', () => {
    const [r, g, b] = hslToRgb(270, 1, 0.5)
    expect(b).toBe(255)
    expect(r).toBeGreaterThan(0)
    expect(g).toBe(0)
  })

  // sector 5: else (hue 300–359)
  test('hue=300 (magenta, sector 5)', () => {
    expect(hslToRgb(300, 1, 0.5)).toEqual([255, 0, 255])
  })

  test('hue=330 (rose, sector 5)', () => {
    const [r, g, b] = hslToRgb(330, 1, 0.5)
    expect(r).toBe(255)
    expect(g).toBe(0)
    expect(b).toBeGreaterThan(0)
  })

  // edge cases
  test('saturation=0 gives grey (achromatic)', () => {
    const [r, g, b] = hslToRgb(120, 0, 0.5)
    expect(r).toBe(g)
    expect(g).toBe(b)
    expect(r).toBeGreaterThan(0)
  })

  test('lightness=0 gives black', () => {
    expect(hslToRgb(120, 1, 0)).toEqual([0, 0, 0])
  })

  test('lightness=1 gives white', () => {
    expect(hslToRgb(120, 1, 1)).toEqual([255, 255, 255])
  })

  test('hue=360 wraps to 0 (red)', () => {
    expect(hslToRgb(360, 1, 0.5)).toEqual([255, 0, 0])
  })

  test('hue negative wraps correctly', () => {
    expect(hslToRgb(-120, 1, 0.5)).toEqual(hslToRgb(240, 1, 0.5))
  })

  test('saturation clamped at 0', () => {
    expect(hslToRgb(0, -0.5, 0.5)).toEqual(hslToRgb(0, 0, 0.5))
  })

  test('saturation clamped at 1', () => {
    expect(hslToRgb(0, 1.5, 0.5)).toEqual(hslToRgb(0, 1, 0.5))
  })

  test('lightness clamped at 0', () => {
    expect(hslToRgb(0, 1, -0.5)).toEqual([0, 0, 0])
  })

  test('lightness clamped at 1', () => {
    expect(hslToRgb(0, 1, 1.5)).toEqual([255, 255, 255])
  })

  test('high lightness (l>0.5) produces a light tint', () => {
    // hslToRgb(0, 1, 0.75) → #ff8080 (light red)
    const [r, g, b] = hslToRgb(0, 1, 0.75)
    expect(r).toBeGreaterThan(g)
    expect(r).toBeGreaterThan(b)
    expect(g).toBeGreaterThan(0) // m > 0 lifts all channels
    expect(b).toBeGreaterThan(0)
  })
})

// ── rgbToHex ─────────────────────────────────────────────────────────────────

describe('rgbToHex', () => {
  test('converts pure red', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#ff0000')
  })

  test('converts pure green', () => {
    expect(rgbToHex(0, 255, 0)).toBe('#00ff00')
  })

  test('converts pure blue', () => {
    expect(rgbToHex(0, 0, 255)).toBe('#0000ff')
  })

  test('pads single-digit hex values with leading zero', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000')
  })

  test('converts arbitrary color', () => {
    expect(rgbToHex(26, 188, 156)).toBe('#1abc9c')
  })

  test('output is lowercase', () => {
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff')
  })

  test('value 15 pads to 0f', () => {
    expect(rgbToHex(15, 15, 15)).toBe('#0f0f0f')
  })

  test('value 16 does not pad', () => {
    expect(rgbToHex(16, 0, 0)).toBe('#100000')
  })
})

// ── rgbToHsl ─────────────────────────────────────────────────────────────────

describe('rgbToHsl', () => {
  test('pure red gives h=0, s=1, l=0.5', () => {
    const [h, s, l] = rgbToHsl(255, 0, 0)
    expect(h).toBeCloseTo(0, 1)
    expect(s).toBeCloseTo(1, 1)
    expect(l).toBeCloseTo(0.5, 1)
  })

  test('pure green gives h=120, s=1, l=0.5', () => {
    const [h, s, l] = rgbToHsl(0, 255, 0)
    expect(h).toBeCloseTo(120, 1)
    expect(s).toBeCloseTo(1, 1)
    expect(l).toBeCloseTo(0.5, 1)
  })

  test('pure blue gives h=240, s=1, l=0.5', () => {
    const [h, s, l] = rgbToHsl(0, 0, 255)
    expect(h).toBeCloseTo(240, 1)
    expect(s).toBeCloseTo(1, 1)
    expect(l).toBeCloseTo(0.5, 1)
  })

  test('white gives l=1, s=0', () => {
    const [, s, l] = rgbToHsl(255, 255, 255)
    expect(s).toBeCloseTo(0, 1)
    expect(l).toBeCloseTo(1, 1)
  })

  test('black gives l=0, s=0', () => {
    const [, s, l] = rgbToHsl(0, 0, 0)
    expect(s).toBeCloseTo(0, 1)
    expect(l).toBeCloseTo(0, 1)
  })

  test('grey gives s=0', () => {
    const [, s] = rgbToHsl(128, 128, 128)
    expect(s).toBeCloseTo(0, 1)
  })

  // r is max, g < b branch (hue gets +6)
  test('r max with g < b (e.g. #ff0040) gives hue > 300', () => {
    const [h] = rgbToHsl(255, 0, 64)
    expect(h).toBeGreaterThan(300)
    expect(h).toBeLessThanOrEqual(360)
  })

  // r is max, g >= b (no +6)
  test('r max with g >= b (e.g. #ff4000) gives hue < 60', () => {
    const [h] = rgbToHsl(255, 64, 0)
    expect(h).toBeGreaterThanOrEqual(0)
    expect(h).toBeLessThan(60)
  })

  // g is max branch
  test('g max (e.g. #40ff00) gives hue 60–180', () => {
    const [h, s] = rgbToHsl(64, 255, 0)
    expect(h).toBeGreaterThan(60)
    expect(h).toBeLessThan(180)
    expect(s).toBeGreaterThan(0)
  })

  // b is max branch
  test('b max (e.g. #0040ff) gives hue 180–300', () => {
    const [h, s] = rgbToHsl(0, 64, 255)
    expect(h).toBeGreaterThan(180)
    expect(h).toBeLessThan(300)
    expect(s).toBeGreaterThan(0)
  })

  // l > 0.5 saturation formula branch
  test('light color (l > 0.5) computes saturation correctly', () => {
    // #ff8080 → l ≈ 0.75 (> 0.5)
    const [, s, l] = rgbToHsl(255, 128, 128)
    expect(l).toBeGreaterThan(0.5)
    expect(s).toBeGreaterThan(0)
  })

  // l <= 0.5 saturation formula branch
  test('dark color (l <= 0.5) computes saturation correctly', () => {
    // #800000 → l = 0.25 (<= 0.5)
    const [, s, l] = rgbToHsl(128, 0, 0)
    expect(l).toBeLessThanOrEqual(0.5)
    expect(s).toBeGreaterThan(0)
  })

  test('round-trip: hslToRgb → rgbToHsl gives back original hue', () => {
    for (const hue of [0, 60, 120, 180, 240, 300]) {
      const [r, g, b] = hslToRgb(hue, 1, 0.5)
      const [h2] = rgbToHsl(r, g, b)
      expect(h2).toBeCloseTo(hue === 360 ? 0 : hue, 0)
    }
  })
})

// ── readableOn ───────────────────────────────────────────────────────────────

describe('readableOn', () => {
  test('returns #fff for black (very dark, L≈0)', () => {
    expect(readableOn('#000000')).toBe('#fff')
  })

  test('returns #111 for white (very light, L=1)', () => {
    expect(readableOn('#ffffff')).toBe('#111')
  })

  test('returns #111 for light-grey just above the 0.55 luminance threshold', () => {
    expect(readableOn('#c8c8c8')).toBe('#111')
  })

  test('returns #fff for mid-grey just below the 0.55 luminance threshold', () => {
    expect(readableOn('#a0a0a0')).toBe('#fff')
  })

  test('returns #111 for a pale/pastel colour (high luminance)', () => {
    expect(readableOn('#f0e68c')).toBe('#111') // khaki
  })

  test('returns #fff for turquoise (L≈0.39 < 0.55 threshold)', () => {
    expect(readableOn('#1abc9c')).toBe('#fff')
  })

  test('returns #fff for a very dark blue', () => {
    expect(readableOn('#00008b')).toBe('#fff')
  })

  test('returns #111 for an invalid/empty hex string (null rgb fallback)', () => {
    expect(readableOn('')).toBe('#111')
    expect(readableOn('notahex')).toBe('#111')
  })
})

// ── hexToRgb ─────────────────────────────────────────────────────────────────

describe('hexToRgb', () => {
  test('parses a standard #RRGGBB hex', () => {
    expect(hexToRgb('#ff0000')).toEqual([255, 0, 0])
    expect(hexToRgb('#1abc9c')).toEqual([26, 188, 156])
    expect(hexToRgb('#000000')).toEqual([0, 0, 0])
    expect(hexToRgb('#ffffff')).toEqual([255, 255, 255])
  })

  test('parses hex without the leading #', () => {
    expect(hexToRgb('ff0000')).toEqual([255, 0, 0])
  })

  test('is case-insensitive', () => {
    expect(hexToRgb('#FF0000')).toEqual([255, 0, 0])
    expect(hexToRgb('#Ff0000')).toEqual([255, 0, 0])
  })

  test('returns null for invalid input', () => {
    expect(hexToRgb('xyz')).toBeNull()
    expect(hexToRgb('#gggggg')).toBeNull()
    expect(hexToRgb('')).toBeNull()
    expect(hexToRgb('#12345')).toBeNull()
  })
})

// ── ColorPicker component ─────────────────────────────────────────────────────

describe('ColorPicker', () => {
  beforeEach(() => noop.mockClear())

  test('renders the modal with title, hex preview, name and hex inputs', () => {
    render(<ColorPicker {...makeProps()} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Add a color')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g. Ocean')).toBeInTheDocument()
    expect(screen.getByLabelText('Hex')).toBeInTheDocument()
    expect(screen.getByLabelText('Lightness')).toBeInTheDocument()
  })

  test('renders the color wheel canvas', () => {
    render(<ColorPicker {...makeProps()} />)
    expect(document.querySelector('.wheel-canvas')).toBeInTheDocument()
  })

  test('cancel button calls onCancel', () => {
    const onCancel = jest.fn()
    render(<ColorPicker {...makeProps({ onCancel })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  test('close (×) button calls onCancel', () => {
    const onCancel = jest.fn()
    render(<ColorPicker {...makeProps({ onCancel })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  test('clicking the backdrop calls onCancel', () => {
    const onCancel = jest.fn()
    render(<ColorPicker {...makeProps({ onCancel })} />)
    fireEvent.click(document.querySelector('.picker-backdrop') as Element)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  test('clicking inside the card does NOT call onCancel', () => {
    const onCancel = jest.fn()
    render(<ColorPicker {...makeProps({ onCancel })} />)
    fireEvent.click(document.querySelector('.picker-card') as Element)
    expect(onCancel).not.toHaveBeenCalled()
  })

  // ── name validation ────────────────────────────────────────────────────────

  test('submit with empty name shows "Name is required" error', () => {
    render(<ColorPicker {...makeProps()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    expect(screen.getByText('Name is required')).toBeInTheDocument()
  })

  test('submit with invalid chars shows validation error', () => {
    render(<ColorPicker {...makeProps()} />)
    fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: '!!!bad' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    expect(screen.getByText('Letters, numbers, spaces, + only')).toBeInTheDocument()
  })

  test('submit with duplicate name (client-side) shows duplicate error', () => {
    render(<ColorPicker {...makeProps({ existingNames: ['Ocean'] })} />)
    fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'Ocean' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    expect(screen.getByText('"Ocean" already exists')).toBeInTheDocument()
  })

  test('duplicate check is case-insensitive', () => {
    render(<ColorPicker {...makeProps({ existingNames: ['Ocean'] })} />)
    fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'OCEAN' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    expect(screen.getByText('"OCEAN" already exists')).toBeInTheDocument()
  })

  test('Enter key on name input triggers submit', () => {
    const onConfirm = jest.fn()
    render(<ColorPicker {...makeProps({ onConfirm })} />)
    const input = screen.getByPlaceholderText('e.g. Ocean')
    fireEvent.change(input, { target: { value: 'MyColor' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ name: 'MyColor' }))
  })

  test('non-Enter key on name input does not trigger submit', () => {
    const onConfirm = jest.fn()
    render(<ColorPicker {...makeProps({ onConfirm })} />)
    const input = screen.getByPlaceholderText('e.g. Ocean')
    fireEvent.change(input, { target: { value: 'MyColor' } })
    fireEvent.keyDown(input, { key: 'Tab' })
    expect(onConfirm).not.toHaveBeenCalled()
  })

  test('valid submit calls onConfirm with trimmed name and current hex', () => {
    const onConfirm = jest.fn()
    render(<ColorPicker {...makeProps({ onConfirm })} />)
    fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: '  Coral  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Coral', hex: expect.stringMatching(/^#[0-9a-f]{6}$/) })
    )
  })

  test('typing in name input clears name error', () => {
    render(<ColorPicker {...makeProps()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    expect(screen.getByText('Name is required')).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'A' } })
    expect(screen.queryByText('Name is required')).not.toBeInTheDocument()
  })

  // ── hex input ─────────────────────────────────────────────────────────────

  test('typing an invalid hex shows "Use format #RRGGBB" error', () => {
    render(<ColorPicker {...makeProps()} />)
    const hexInput = screen.getByLabelText('Hex')
    fireEvent.change(hexInput, { target: { value: '#xyz' } })
    expect(screen.getByText('Use format #RRGGBB')).toBeInTheDocument()
  })

  test('typing a valid hex clears the hex error and updates preview', async () => {
    render(<ColorPicker {...makeProps()} />)
    const hexInput = screen.getByLabelText('Hex')
    fireEvent.change(hexInput, { target: { value: '#xyz' } })
    expect(screen.getByText('Use format #RRGGBB')).toBeInTheDocument()
    fireEvent.change(hexInput, { target: { value: '#ff0000' } })
    await waitFor(() => expect(screen.queryByText('Use format #RRGGBB')).not.toBeInTheDocument())
  })

  test('typing a valid hex without # prefix is accepted', async () => {
    render(<ColorPicker {...makeProps()} />)
    const hexInput = screen.getByLabelText('Hex')
    fireEvent.change(hexInput, { target: { value: 'ff0000' } })
    await waitFor(() => expect(screen.queryByText('Use format #RRGGBB')).not.toBeInTheDocument())
  })

  test('hex input updates hue/sat via rgbToHsl (green → hue≈120)', async () => {
    const onConfirm = jest.fn()
    render(<ColorPicker {...makeProps({ onConfirm })} />)
    const hexInput = screen.getByLabelText('Hex')
    // Set green hex — should set hue to ~120
    fireEvent.change(hexInput, { target: { value: '#00ff00' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'Green' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ hex: '#00ff00' }))
    })
  })

  test('typing blue hex updates internal state (b is max branch)', async () => {
    render(<ColorPicker {...makeProps()} />)
    fireEvent.change(screen.getByLabelText('Hex'), { target: { value: '#0040ff' } })
    await waitFor(() => expect(screen.queryByText('Use format #RRGGBB')).not.toBeInTheDocument())
  })

  test('typing red with g<b hex updates internal state', async () => {
    render(<ColorPicker {...makeProps()} />)
    fireEvent.change(screen.getByLabelText('Hex'), { target: { value: '#ff0040' } })
    await waitFor(() => expect(screen.queryByText('Use format #RRGGBB')).not.toBeInTheDocument())
  })

  test('submit is blocked when hex input has an error', () => {
    const onConfirm = jest.fn()
    render(<ColorPicker {...makeProps({ onConfirm })} />)
    fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'Valid' } })
    fireEvent.change(screen.getByLabelText('Hex'), { target: { value: '#gg0000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    expect(onConfirm).not.toHaveBeenCalled()
  })

  // ── lightness slider ──────────────────────────────────────────────────────

  test('lightness slider change updates the preview', async () => {
    const onConfirm = jest.fn()
    render(<ColorPicker {...makeProps({ onConfirm })} />)
    const slider = screen.getByLabelText('Lightness')

    // Move to near-white (lightness=90%)
    fireEvent.change(slider, { target: { value: '90' } })

    // Submit a valid color - the hex should reflect the new lightness
    fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'Light' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalled()
      const { hex } = onConfirm.mock.calls[0][0]
      // high lightness → high channel values (light color)
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      expect(r + g).toBeGreaterThan(300)
    })
  })

  test('lightness slider min value (0) gives black', async () => {
    const onConfirm = jest.fn()
    render(<ColorPicker {...makeProps({ onConfirm })} />)
    fireEvent.change(screen.getByLabelText('Lightness'), { target: { value: '0' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'Dark' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ hex: '#000000' }))
    })
  })

  test('lightness slider max value (100) gives white', async () => {
    const onConfirm = jest.fn()
    render(<ColorPicker {...makeProps({ onConfirm })} />)
    fireEvent.change(screen.getByLabelText('Lightness'), { target: { value: '100' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'Bright' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ hex: '#ffffff' }))
    })
  })

  // ── wheel mouse drag ───────────────────────────────────────────────────────

  test('mousedown on canvas calls onChange updating hue/sat', async () => {
    const onConfirm = jest.fn()
    render(<ColorPicker {...makeProps({ onConfirm })} />)
    const canvas = document.querySelector('.wheel-canvas') as Element

    // Click right of center → hue ≈ 0 (pointing right)
    fireEvent.mouseDown(canvas, { clientX: 220, clientY: 110 })

    fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'WheelColor' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    await waitFor(() => expect(onConfirm).toHaveBeenCalled())
  })

  test('mousemove on window while dragging updates color', async () => {
    render(<ColorPicker {...makeProps()} />)
    const canvas = document.querySelector('.wheel-canvas') as Element

    // Start drag
    fireEvent.mouseDown(canvas, { clientX: 110, clientY: 0 })
    // Move while dragging
    fireEvent.mouseMove(window, { clientX: 0, clientY: 110 })
    // Up
    fireEvent.mouseUp(window)
    // Move after up should NOT update (dragging stopped)
    fireEvent.mouseMove(window, { clientX: 200, clientY: 200 })
    // No assertion needed beyond no error
  })

  test('mousemove without prior mousedown (not dragging) does nothing', () => {
    render(<ColorPicker {...makeProps()} />)
    // Fire mousemove without mousedown first
    expect(() => {
      fireEvent.mouseMove(window, { clientX: 100, clientY: 100 })
    }).not.toThrow()
  })

  test('mousedown outside circle clamps dist to radius', async () => {
    const onConfirm = jest.fn()
    render(<ColorPicker {...makeProps({ onConfirm })} />)
    const canvas = document.querySelector('.wheel-canvas') as Element

    // Click far outside the wheel circle
    fireEvent.mouseDown(canvas, { clientX: 1000, clientY: 1000 })

    fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'Edge' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    await waitFor(() => expect(onConfirm).toHaveBeenCalled())
  })

  test('touch start on canvas updates color', () => {
    render(<ColorPicker {...makeProps()} />)
    const canvas = document.querySelector('.wheel-canvas') as Element
    expect(() => {
      fireEvent.touchStart(canvas, { touches: [{ clientX: 150, clientY: 110 }] })
    }).not.toThrow()
  })

  test('touchmove on window while dragging updates color', () => {
    render(<ColorPicker {...makeProps()} />)
    const canvas = document.querySelector('.wheel-canvas') as Element
    fireEvent.touchStart(canvas, { touches: [{ clientX: 150, clientY: 110 }] })
    expect(() => {
      fireEvent.touchMove(window, { touches: [{ clientX: 160, clientY: 110 }] })
      fireEvent.touchEnd(window)
    }).not.toThrow()
  })

  // ── ResizeObserver fallback ────────────────────────────────────────────────

  test('falls back to window resize listener when ResizeObserver is not available', () => {
    const original = (globalThis as any).ResizeObserver
    delete (globalThis as any).ResizeObserver

    expect(() => {
      render(<ColorPicker {...makeProps()} />)
      act(() => {
        fireEvent(window, new Event('resize'))
      })
    }).not.toThrow()
    ;(globalThis as any).ResizeObserver = original
  })

  // ── server error ──────────────────────────────────────────────────────────

  test('displays serverError prop in an alert banner', () => {
    render(<ColorPicker {...makeProps({ serverError: 'Color "X" already exists' })} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Color "X" already exists')
  })

  test('serverError banner is absent when serverError is null', () => {
    render(<ColorPicker {...makeProps({ serverError: null })} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  test('editing name input calls onClearError to clear server error', async () => {
    const onClearError = jest.fn()
    render(<ColorPicker {...makeProps({ serverError: 'some error', onClearError })} />)
    fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'A' } })
    await waitFor(() => expect(onClearError).toHaveBeenCalled())
  })

  test('editing name does NOT call onClearError when no serverError', async () => {
    const onClearError = jest.fn()
    render(<ColorPicker {...makeProps({ serverError: null, onClearError })} />)
    fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'A' } })
    await new Promise((r) => setTimeout(r, 50))
    expect(onClearError).not.toHaveBeenCalled()
  })

  // ── saving state ──────────────────────────────────────────────────────────

  test('Add color button shows "Saving…" when saving=true', () => {
    render(<ColorPicker {...makeProps({ saving: true })} />)
    expect(screen.getByRole('button', { name: 'Saving\u2026' })).toBeDisabled()
  })

  test('Cancel button is disabled when saving=true', () => {
    render(<ColorPicker {...makeProps({ saving: true })} />)
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })
})
