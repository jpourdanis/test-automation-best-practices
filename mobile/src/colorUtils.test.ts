import { hslToRgb, rgbToHex, hexToRgb, rgbToHsl, readableOn } from './colorUtils'

describe('colorUtils', () => {
  describe('hslToRgb', () => {
    it('converts HSL to RGB correctly', () => {
      expect(hslToRgb(0, 1, 0.5)).toEqual([255, 0, 0])
      expect(hslToRgb(120, 1, 0.5)).toEqual([0, 255, 0])
      expect(hslToRgb(240, 1, 0.5)).toEqual([0, 0, 255])
      expect(hslToRgb(0, 0, 1)).toEqual([255, 255, 255])
      expect(hslToRgb(0, 0, 0)).toEqual([0, 0, 0])
    })

    it('handles negative hues and overflow', () => {
      expect(hslToRgb(-120, 1, 0.5)).toEqual([0, 0, 255])
      expect(hslToRgb(480, 1, 0.5)).toEqual([0, 255, 0])
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
      expect(hexToRgb('#ff0')).toBeNull() // Our util regex requires 6 chars
    })
  })

  describe('rgbToHsl', () => {
    it('converts RGB to HSL correctly', () => {
      const red = rgbToHsl(255, 0, 0)
      expect(red[0]).toBe(0)
      expect(red[1]).toBe(1)
      expect(red[2]).toBe(0.5)

      const green = rgbToHsl(0, 255, 0)
      expect(green[0]).toBe(120)
      expect(green[1]).toBe(1)
      expect(green[2]).toBe(0.5)

      const white = rgbToHsl(255, 255, 255)
      expect(white[0]).toBe(0)
      expect(white[1]).toBe(0)
      expect(white[2]).toBe(1)
    })
  })

  describe('readableOn', () => {
    it('returns white on dark colors', () => {
      expect(readableOn('#000000')).toBe('#ffffff')
      expect(readableOn('#0000ff')).toBe('#ffffff')
    })

    it('returns black on light colors', () => {
      expect(readableOn('#ffffff')).toBe('#111111')
      expect(readableOn('#00ff00')).toBe('#111111')
      expect(readableOn('#ffff00')).toBe('#111111')
    })

    it('handles invalid colors gracefully', () => {
      expect(readableOn('invalid')).toBe('#111')
    })
  })
})
