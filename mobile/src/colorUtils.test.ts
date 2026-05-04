import { hslToRgb, rgbToHex, hexToRgb, rgbToHsl, readableOn } from './colorUtils'

describe('colorUtils', () => {
  describe('hslToRgb', () => {
    it('converts HSL to RGB correctly across all hue segments', () => {
      // hueSegment [0, 1) -> 0
      expect(hslToRgb(0, 1, 0.5)).toEqual([255, 0, 0])
      // hueSegment [1, 2) -> 60
      expect(hslToRgb(60, 1, 0.5)).toEqual([255, 255, 0])
      // hueSegment [2, 3) -> 120
      expect(hslToRgb(120, 1, 0.5)).toEqual([0, 255, 0])
      // hueSegment [3, 4) -> 180
      expect(hslToRgb(180, 1, 0.5)).toEqual([0, 255, 255])
      // hueSegment [4, 5) -> 240
      expect(hslToRgb(240, 1, 0.5)).toEqual([0, 0, 255])
      // hueSegment [5, 6) -> 300
      expect(hslToRgb(300, 1, 0.5)).toEqual([255, 0, 255])

      // Achromatic
      expect(hslToRgb(0, 0, 1)).toEqual([255, 255, 255])
      expect(hslToRgb(0, 0, 0)).toEqual([0, 0, 0])
    })

    it('handles negative hues and overflow', () => {
      expect(hslToRgb(-120, 1, 0.5)).toEqual([0, 0, 255]) // equivalent to 240
      expect(hslToRgb(480, 1, 0.5)).toEqual([0, 255, 0]) // equivalent to 120
    })

    it('clamps saturation and lightness to valid ranges', () => {
      expect(hslToRgb(0, 1.5, 0.5)).toEqual([255, 0, 0])
      expect(hslToRgb(0, -0.5, 0.5)).toEqual([128, 128, 128])
      expect(hslToRgb(0, 1, 1.5)).toEqual([255, 255, 255])
      expect(hslToRgb(0, 1, -0.5)).toEqual([0, 0, 0])
    })
  })

  describe('rgbToHex', () => {
    it('converts RGB to HEX correctly', () => {
      expect(rgbToHex(255, 0, 0)).toBe('#ff0000')
      expect(rgbToHex(0, 255, 0)).toBe('#00ff00')
      expect(rgbToHex(0, 0, 255)).toBe('#0000ff')
      expect(rgbToHex(255, 255, 255)).toBe('#ffffff')
      expect(rgbToHex(0, 0, 0)).toBe('#000000')
    })

    it('clamps values out of 0-255 bounds and rounds fractions', () => {
      expect(rgbToHex(-10, 300, 128.6)).toBe('#00ff81')
    })
  })

  describe('hexToRgb', () => {
    it('converts HEX to RGB correctly', () => {
      expect(hexToRgb('#ff0000')).toEqual([255, 0, 0])
      expect(hexToRgb('#00ff00')).toEqual([0, 255, 0])
      expect(hexToRgb('#0000ff')).toEqual([0, 0, 255])
      expect(hexToRgb('#ffffff')).toEqual([255, 255, 255])
      expect(hexToRgb('#000000')).toEqual([0, 0, 0])
      expect(hexToRgb('ff0000')).toEqual([255, 0, 0])
    })

    it('returns null for invalid HEX', () => {
      expect(hexToRgb('invalid')).toBeNull()
      expect(hexToRgb('#ff0')).toBeNull() // Currently our util strictly requires 6 chars
    })
  })

  describe('rgbToHsl', () => {
    it('converts RGB to HSL correctly', () => {
      // Red (max = r)
      const red = rgbToHsl(255, 0, 0)
      expect(red[0]).toBe(0)
      expect(red[1]).toBe(1)
      expect(red[2]).toBe(0.5)

      // Green (max = g)
      const green = rgbToHsl(0, 255, 0)
      expect(green[0]).toBe(120)
      expect(green[1]).toBe(1)
      expect(green[2]).toBe(0.5)

      // Blue (max = b)
      const blue = rgbToHsl(0, 0, 255)
      expect(blue[0]).toBe(240)
      expect(blue[1]).toBe(1)
      expect(blue[2]).toBe(0.5)

      // White (delta = 0)
      const white = rgbToHsl(255, 255, 255)
      expect(white[0]).toBe(0)
      expect(white[1]).toBe(0)
      expect(white[2]).toBe(1)

      // Darker mixed color (lightness <= 0.5)
      // RGB(64, 0, 128) -> roughly max=0.5, min=0, delta=0.5, l=0.25 (<= 0.5)
      const purple = rgbToHsl(64, 0, 128)
      expect(purple[0]).toBeCloseTo(270, 1)
      expect(purple[1]).toBeCloseTo(1, 1)
      expect(purple[2]).toBeCloseTo(0.25, 2)

      // Lighter color (lightness > 0.5)
      // RGB(255, 128, 128) -> roughly max=1, min=0.5, delta=0.5, l=0.75 (> 0.5)
      const lightPink = rgbToHsl(255, 128, 128)
      expect(lightPink[0]).toBeCloseTo(0, 1) // Hue = 0
      expect(lightPink[1]).toBeCloseTo(1, 1) // Saturation = 1
      expect(lightPink[2]).toBeCloseTo(0.75, 2)

      // Magenta-ish color (max = r, g < b) to cover the negative hue offset branch
      const magenta = rgbToHsl(255, 0, 255) // max=1 (r), g=0, b=1. g < b is true
      expect(magenta[0]).toBeCloseTo(300, 1) // Hue = 300
      expect(magenta[1]).toBeCloseTo(1, 1)
      expect(magenta[2]).toBeCloseTo(0.5, 2)
    })
  })

  describe('readableOn', () => {
    it('returns white on dark colors', () => {
      expect(readableOn('#000000')).toBe('#ffffff')
      expect(readableOn('#0000ff')).toBe('#ffffff')
      expect(readableOn('#111111')).toBe('#ffffff') // Very dark grey
    })

    it('returns dark on light colors', () => {
      expect(readableOn('#ffffff')).toBe('#111111')
      expect(readableOn('#00ff00')).toBe('#111111')
      expect(readableOn('#ffff00')).toBe('#111111')
    })

    it('handles invalid colors gracefully', () => {
      expect(readableOn('invalid')).toBe('#111111')
    })
  })
})
