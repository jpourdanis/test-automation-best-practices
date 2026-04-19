import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { readableOn, hexToRgb, hslToRgb, rgbToHex, rgbToHsl, ColorPicker } from './ColorPicker'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string>) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const en = require('./locales/en.json')
      const parts = key.split('.')
      let value: unknown = en
      for (const part of parts) {
        value = (value as Record<string, unknown>)?.[part]
      }
      if (typeof value === 'string' && options) {
        return value.replace(/\{\{(\w+)\}\}/g, (_: string, k: string) => options[k] ?? `{{${k}}}`)
      }
      return typeof value === 'string' ? value : key
    }
  })
}))

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
  // sector 0: hp in [0,1) — hue 0–59
  test('hue=0 (red) → [255,0,0]', () => {
    expect(hslToRgb(0, 1, 0.5)).toEqual([255, 0, 0])
  })
  test('hue=30 (orange) → [255,128,0]', () => {
    expect(hslToRgb(30, 1, 0.5)).toEqual([255, 128, 0])
  })
  test('hue=59 stays in sector 0', () => {
    const [r, , b] = hslToRgb(59, 1, 0.5)
    expect(r).toBe(255)
    expect(b).toBe(0)
  })

  // sector 1: hp in [1,2) — hue 60–119
  test('hue=60 (yellow) → [255,255,0]', () => {
    expect(hslToRgb(60, 1, 0.5)).toEqual([255, 255, 0])
  })
  test('hue=90 (chartreuse) → [128,255,0]', () => {
    expect(hslToRgb(90, 1, 0.5)).toEqual([128, 255, 0])
  })

  // sector 2: hp in [2,3) — hue 120–179
  test('hue=120 (green) → [0,255,0]', () => {
    expect(hslToRgb(120, 1, 0.5)).toEqual([0, 255, 0])
  })
  test('hue=150 (spring green) → [0,255,128]', () => {
    expect(hslToRgb(150, 1, 0.5)).toEqual([0, 255, 128])
  })

  // sector 3: hp in [3,4) — hue 180–239
  test('hue=180 (cyan) → [0,255,255]', () => {
    expect(hslToRgb(180, 1, 0.5)).toEqual([0, 255, 255])
  })
  test('hue=210 (azure) → [0,128,255]', () => {
    expect(hslToRgb(210, 1, 0.5)).toEqual([0, 128, 255])
  })

  // sector 4: hp in [4,5) — hue 240–299
  test('hue=240 (blue) → [0,0,255]', () => {
    expect(hslToRgb(240, 1, 0.5)).toEqual([0, 0, 255])
  })
  test('hue=270 (violet) → [128,0,255]', () => {
    expect(hslToRgb(270, 1, 0.5)).toEqual([128, 0, 255])
  })

  // sector 5: hp in [5,6) — hue 300–359
  test('hue=300 (magenta) → [255,0,255]', () => {
    expect(hslToRgb(300, 1, 0.5)).toEqual([255, 0, 255])
  })
  test('hue=330 (rose) → [255,0,128]', () => {
    expect(hslToRgb(330, 1, 0.5)).toEqual([255, 0, 128])
  })

  // boundary: exact sector transitions
  test('hue just below 60 is in sector 0, not sector 1', () => {
    const below = hslToRgb(59.9, 1, 0.5)
    const sector0 = hslToRgb(30, 1, 0.5)
    // both should have r=255, b=0 (sector 0 pattern)
    expect(below[0]).toBe(255)
    expect(below[2]).toBe(0)
    expect(sector0[0]).toBe(255)
  })

  // edge cases — exact
  test('saturation=0 gives pure grey [128,128,128]', () => {
    expect(hslToRgb(120, 0, 0.5)).toEqual([128, 128, 128])
  })
  test('lightness=0 gives black', () => {
    expect(hslToRgb(120, 1, 0)).toEqual([0, 0, 0])
  })
  test('lightness=1 gives white', () => {
    expect(hslToRgb(120, 1, 1)).toEqual([255, 255, 255])
  })
  test('hue=360 wraps to hue=0 → [255,0,0]', () => {
    expect(hslToRgb(360, 1, 0.5)).toEqual([255, 0, 0])
  })
  test('negative hue wraps: hue=-120 = hue=240', () => {
    expect(hslToRgb(-120, 1, 0.5)).toEqual([0, 0, 255])
  })
  test('saturation clamped: s=-0.5 treated as s=0', () => {
    expect(hslToRgb(0, -0.5, 0.5)).toEqual([128, 128, 128])
  })
  test('saturation clamped: s=1.5 treated as s=1', () => {
    expect(hslToRgb(0, 1.5, 0.5)).toEqual([255, 0, 0])
  })
  test('lightness clamped: l=-0.5 gives black', () => {
    expect(hslToRgb(0, 1, -0.5)).toEqual([0, 0, 0])
  })
  test('lightness clamped: l=1.5 gives white', () => {
    expect(hslToRgb(0, 1, 1.5)).toEqual([255, 255, 255])
  })
  test('high lightness l=0.75 → [255,128,128]', () => {
    expect(hslToRgb(0, 1, 0.75)).toEqual([255, 128, 128])
  })
  test('low lightness l=0.25 → [128,0,0]', () => {
    expect(hslToRgb(0, 1, 0.25)).toEqual([128, 0, 0])
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
  // achromatic: max === min → s=0, h=0
  test('black [0,0,0] → h=0, s=0, l=0', () => {
    expect(rgbToHsl(0, 0, 0)).toEqual([0, 0, 0])
  })
  test('white [255,255,255] → h=0, s=0, l=1', () => {
    expect(rgbToHsl(255, 255, 255)).toEqual([0, 0, 1])
  })
  test('mid-grey [128,128,128] → s=0', () => {
    const [, s] = rgbToHsl(128, 128, 128)
    expect(s).toBe(0)
  })

  // r is max, g >= b (no +6 offset)
  test('pure red → h=0, s=1, l=0.5', () => {
    const [h, s, l] = rgbToHsl(255, 0, 0)
    expect(h).toBeCloseTo(0, 5)
    expect(s).toBeCloseTo(1, 5)
    expect(l).toBeCloseTo(0.5, 5)
  })
  test('r max, g>0, b=0 → h in (0,60)', () => {
    const [h] = rgbToHsl(255, 128, 0)
    expect(h).toBeCloseTo(30, 0)
  })

  // r is max, g < b (gets +6·60 = +360 offset before *60)
  test('r max with g<b (#ff0040) → h near 345', () => {
    const [h] = rgbToHsl(255, 0, 64)
    expect(h).toBeGreaterThan(340)
    expect(h).toBeLessThanOrEqual(360)
  })

  // g is max
  test('pure green → h=120, s=1, l=0.5', () => {
    const [h, s, l] = rgbToHsl(0, 255, 0)
    expect(h).toBeCloseTo(120, 5)
    expect(s).toBeCloseTo(1, 5)
    expect(l).toBeCloseTo(0.5, 5)
  })
  test('g max with b>r (#00ff80) → h near 150', () => {
    const [h] = rgbToHsl(0, 255, 128)
    expect(h).toBeCloseTo(150, 0)
  })

  // b is max
  test('pure blue → h=240, s=1, l=0.5', () => {
    const [h, s, l] = rgbToHsl(0, 0, 255)
    expect(h).toBeCloseTo(240, 5)
    expect(s).toBeCloseTo(1, 5)
    expect(l).toBeCloseTo(0.5, 5)
  })
  test('b max (#0040ff) → h in (180,300)', () => {
    const [h] = rgbToHsl(0, 64, 255)
    expect(h).toBeGreaterThan(180)
    expect(h).toBeLessThan(300)
  })

  // l > 0.5 saturation: d / (2 - max - min)
  test('light red (#ff8080): l>0.5, s computed via (2-max-min) branch', () => {
    const [h, s, l] = rgbToHsl(255, 128, 128)
    expect(h).toBeCloseTo(0, 0)
    expect(l).toBeGreaterThan(0.5)
    expect(s).toBeCloseTo(1, 5)
  })

  // l <= 0.5 saturation: d / (max + min)
  test('dark red (#800000): l<0.5, s=1 (l<=0.5 saturation branch)', () => {
    const [h, s, l] = rgbToHsl(128, 0, 0)
    expect(h).toBeCloseTo(0, 0)
    expect(l).toBeLessThan(0.5)
    expect(l).toBeGreaterThan(0.2)
    expect(s).toBeCloseTo(1, 5)
  })

  // round-trip
  test('round-trip hslToRgb→rgbToHsl preserves hue for all sectors', () => {
    for (const hue of [0, 60, 120, 180, 240, 300]) {
      const [r, g, b] = hslToRgb(hue, 1, 0.5)
      const [h2] = rgbToHsl(r, g, b)
      expect(h2).toBeCloseTo(hue, 0)
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

  test('returns #111 for light-grey (L≈0.60, above 0.179 threshold)', () => {
    expect(readableOn('#c8c8c8')).toBe('#111')
  })

  test('returns #111 for mid-grey (L≈0.35, black gives better contrast)', () => {
    expect(readableOn('#a0a0a0')).toBe('#111')
  })

  test('returns #111 for a pale/pastel colour (high luminance)', () => {
    expect(readableOn('#f0e68c')).toBe('#111') // khaki
  })

  test('returns #111 for turquoise (L≈0.39, black gives better contrast)', () => {
    expect(readableOn('#1abc9c')).toBe('#111')
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

  // ── wheel mouse drag — exact value assertions kill arithmetic mutations ──────

  // JSDOM: getBoundingClientRect() returns {left:0, top:0}
  // wheelSize default=220, r=110
  // mouseDown(220, 110): x=220-0-110=110, y=110-0-110=0, dist=110=r, angle=0 → hue=0, sat=1
  // hslToRgb(0,1,0.5) = [255,0,0] → #ff0000
  test('mousedown at right-center (hue=0) sets hex to #ff0000', async () => {
    const onConfirm = jest.fn()
    render(<ColorPicker {...makeProps({ onConfirm })} />)
    const canvas = document.querySelector('.wheel-canvas') as Element

    fireEvent.mouseDown(canvas, { clientX: 220, clientY: 110 })

    fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'Red' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith({ name: 'Red', hex: '#ff0000' })
    })
  })

  // mouseDown(0, 110): x=0-0-110=-110, y=110-0-110=0, dist=110=r, angle=180 → hue=180, sat=1
  // hslToRgb(180,1,0.5) = [0,255,255] → #00ffff
  test('mousedown at left-center (hue=180) sets hex to #00ffff', async () => {
    const onConfirm = jest.fn()
    render(<ColorPicker {...makeProps({ onConfirm })} />)
    const canvas = document.querySelector('.wheel-canvas') as Element

    fireEvent.mouseDown(canvas, { clientX: 0, clientY: 110 })

    fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'Cyan' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith({ name: 'Cyan', hex: '#00ffff' })
    })
  })

  // mouseDown(110, 220): x=0, y=110, dist=110=r, angle=atan2(110,0)*180/π=90 → hue=90, sat=1
  // hslToRgb(90,1,0.5): hp=1.5 → sector 1 [x,c,0], x=c=1*(1-|1.5%2-1|)=0.5, c=1
  // wait: h=90 → hp=1.5, c=1, x=1*(1-0.5)=0.5 → [0.5,1,0] + m=0 → [128,255,0] → #80ff00
  test('mousedown at bottom-center (hue=90) sets hex to #80ff00', async () => {
    const onConfirm = jest.fn()
    render(<ColorPicker {...makeProps({ onConfirm })} />)
    const canvas = document.querySelector('.wheel-canvas') as Element

    fireEvent.mouseDown(canvas, { clientX: 110, clientY: 220 })

    fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'Lime' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith({ name: 'Lime', hex: '#80ff00' })
    })
  })

  // mouseDown at top: x=0, y=-110 → angle=atan2(-110,0)*180/π=-90, +360=270, sat=1
  // hslToRgb(270,1,0.5) = [128,0,255] → #8000ff
  test('mousedown at top-center (hue=270) sets hex to #8000ff', async () => {
    const onConfirm = jest.fn()
    render(<ColorPicker {...makeProps({ onConfirm })} />)
    const canvas = document.querySelector('.wheel-canvas') as Element

    fireEvent.mouseDown(canvas, { clientX: 110, clientY: 0 })

    fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'Violet' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith({ name: 'Violet', hex: '#8000ff' })
    })
  })

  // mousedown outside circle: dist clamped to r → sat=1
  // mouseDown(1000, 110): x=890, y=0, dist=890>r=110 → dist=110=r, angle=0 → hue=0, sat=1 → #ff0000
  test('mousedown outside circle clamps sat to 1', async () => {
    const onConfirm = jest.fn()
    render(<ColorPicker {...makeProps({ onConfirm })} />)
    const canvas = document.querySelector('.wheel-canvas') as Element

    fireEvent.mouseDown(canvas, { clientX: 1000, clientY: 110 })

    fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'Clamped' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith({ name: 'Clamped', hex: '#ff0000' })
    })
  })

  // mousemove while dragging DOES update color (tests dragging.current=true)
  // mouseDown(110,110) → x=0, y=0, dist=0, angle=0, sat=0 → grey #808080
  // mouseMove to (220,110) → x=110, y=0, dist=110=r, angle=0, sat=1 → #ff0000
  test('mousemove while dragging updates hex (dragging.current=true kills mutation)', async () => {
    const onConfirm = jest.fn()
    render(<ColorPicker {...makeProps({ onConfirm })} />)
    const canvas = document.querySelector('.wheel-canvas') as Element

    fireEvent.mouseDown(canvas, { clientX: 110, clientY: 110 }) // center → sat=0 → grey
    fireEvent.mouseMove(window, { clientX: 220, clientY: 110 }) // right → sat=1 → red

    fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'Dragged' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith({ name: 'Dragged', hex: '#ff0000' })
    })
  })

  test('mousemove after mouseup does NOT update color (dragging stopped)', async () => {
    const onConfirm = jest.fn()
    render(<ColorPicker {...makeProps({ onConfirm })} />)
    const canvas = document.querySelector('.wheel-canvas') as Element

    // Set hue=0 sat=1 by dragging to right
    fireEvent.mouseDown(canvas, { clientX: 220, clientY: 110 })
    fireEvent.mouseUp(window) // stop dragging
    // Move to top (would give hue=270) — but should NOT update
    fireEvent.mouseMove(window, { clientX: 110, clientY: 0 })

    fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'Stopped' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    await waitFor(() => {
      // Should still be #ff0000 from original mousedown, NOT #8000ff from the mousemove
      expect(onConfirm).toHaveBeenCalledWith({ name: 'Stopped', hex: '#ff0000' })
    })
  })

  test('mousemove without prior mousedown (not dragging) does not change color', async () => {
    const onConfirm = jest.fn()
    render(<ColorPicker {...makeProps({ onConfirm })} />)

    // Fire mousemove without mousedown — dragging.current stays false
    fireEvent.mouseMove(window, { clientX: 220, clientY: 110 })

    // Color should still be the initial #1980e6
    fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'NoChange' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith({ name: 'NoChange', hex: '#1980e6' })
    })
  })

  // ── wheel cursor position — kills arithmetic mutations in cx/cy ────────────

  // After mouseDown at right edge: hue=0, sat=1
  // r=110, rad=0, cx=110+cos(0)*1*110=220, cy=110+sin(0)*1*110=110
  test('wheel cursor moves to (220,110) after right-edge click (hue=0, sat=1)', () => {
    render(<ColorPicker {...makeProps()} />)
    const canvas = document.querySelector('.wheel-canvas') as Element
    fireEvent.mouseDown(canvas, { clientX: 220, clientY: 110 })

    const cursor = document.querySelector('.wheel-cursor') as HTMLElement
    expect(cursor.style.left).toBe('220px')
    expect(cursor.style.top).toBe('110px')
  })

  // After mouseDown at center: hue=0, sat=0
  // r=110, rad=0, cx=110+cos(0)*0*110=110, cy=110+sin(0)*0*110=110
  test('wheel cursor is at (110,110) at center (sat=0)', () => {
    render(<ColorPicker {...makeProps()} />)
    const canvas = document.querySelector('.wheel-canvas') as Element
    fireEvent.mouseDown(canvas, { clientX: 110, clientY: 110 }) // center

    const cursor = document.querySelector('.wheel-cursor') as HTMLElement
    expect(cursor.style.left).toBe('110px')
    expect(cursor.style.top).toBe('110px')
  })

  // ── touch events ─────────────────────────────────────────────────────────

  // touchStart at right edge → hue=0, sat=1 → #ff0000
  test('touch start on canvas sets hex to #ff0000 at right edge', async () => {
    const onConfirm = jest.fn()
    render(<ColorPicker {...makeProps({ onConfirm })} />)
    const canvas = document.querySelector('.wheel-canvas') as Element

    fireEvent.touchStart(canvas, { touches: [{ clientX: 220, clientY: 110 }] })

    fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'Touch' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith({ name: 'Touch', hex: '#ff0000' })
    })
  })

  // touchMove while dragging updates color
  test('touchmove while dragging updates hex', async () => {
    const onConfirm = jest.fn()
    render(<ColorPicker {...makeProps({ onConfirm })} />)
    const canvas = document.querySelector('.wheel-canvas') as Element

    fireEvent.touchStart(canvas, { touches: [{ clientX: 110, clientY: 110 }] }) // center → grey
    fireEvent.touchMove(window, { touches: [{ clientX: 220, clientY: 110 }] }) // right → red

    fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'TouchMove' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith({ name: 'TouchMove', hex: '#ff0000' })
    })
  })

  test('touchend stops dragging (touchmove after touchend is ignored)', async () => {
    const onConfirm = jest.fn()
    render(<ColorPicker {...makeProps({ onConfirm })} />)
    const canvas = document.querySelector('.wheel-canvas') as Element

    fireEvent.touchStart(canvas, { touches: [{ clientX: 220, clientY: 110 }] }) // right → red
    fireEvent.touchEnd(window)
    // Move to top after end — should NOT update
    fireEvent.touchMove(window, { touches: [{ clientX: 110, clientY: 0 }] })

    fireEvent.change(screen.getByPlaceholderText('e.g. Ocean'), { target: { value: 'TouchEnd' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith({ name: 'TouchEnd', hex: '#ff0000' })
    })
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
