/**
 * Utility functions for color conversions and calculations.
 */

type RGB = [number, number, number]
type HSL = [number, number, number]

const COLOR_CONSTANTS = {
  MAX_HUE: 360,
  HUE_SEGMENT_DEGREES: 60,
  MAX_RGB: 255,
  HEX_BASE: 16,
  LIGHTNESS_MIDPOINT: 0.5,
  HUE_OFFSET_G: 2,
  HUE_OFFSET_B: 4,
  HUE_OFFSET_NEG_R: 6
} as const

const LUMINANCE_CONSTANTS = {
  SRGB_THRESHOLD: 0.03928,
  SRGB_DIVISOR: 12.92,
  SRGB_OFFSET: 0.055,
  SRGB_SCALE: 1.055,
  SRGB_GAMMA: 2.4,
  WEIGHT_R: 0.2126,
  WEIGHT_G: 0.7152,
  WEIGHT_B: 0.0722,
  READABLE_THRESHOLD: 0.179,
  DARK_TEXT: '#111111',
  LIGHT_TEXT: '#ffffff'
} as const

/**
 * Converts HSL color values to RGB.
 * @param h Hue (0-360)
 * @param s Saturation (0-1)
 * @param l Lightness (0-1)
 * @returns An array containing [R, G, B] values in the range 0-255.
 */
export function hslToRgb(h: number, s: number, l: number): RGB {
  const normalizedHue = ((h % COLOR_CONSTANTS.MAX_HUE) + COLOR_CONSTANTS.MAX_HUE) % COLOR_CONSTANTS.MAX_HUE
  const saturation = Math.max(0, Math.min(1, s))
  const lightness = Math.max(0, Math.min(1, l))

  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const hueSegment = normalizedHue / COLOR_CONSTANTS.HUE_SEGMENT_DEGREES
  const x = chroma * (1 - Math.abs((hueSegment % 2) - 1))
  const match = lightness - chroma / 2

  let r = 0
  let g = 0
  let b = 0

  if (hueSegment >= 0 && hueSegment < 1) {
    r = chroma
    g = x
  } else if (hueSegment >= 1 && hueSegment < 2) {
    r = x
    g = chroma
  } else if (hueSegment >= 2 && hueSegment < 3) {
    g = chroma
    b = x
  } else if (hueSegment >= 3 && hueSegment < 4) {
    g = x
    b = chroma
  } else if (hueSegment >= 4 && hueSegment < 5) {
    r = x
    b = chroma
  } else {
    r = chroma
    b = x
  }

  return [
    Math.round((r + match) * COLOR_CONSTANTS.MAX_RGB),
    Math.round((g + match) * COLOR_CONSTANTS.MAX_RGB),
    Math.round((b + match) * COLOR_CONSTANTS.MAX_RGB)
  ]
}

/**
 * Converts RGB color values to a hex string.
 * @param r Red (0-255)
 * @param g Green (0-255)
 * @param b Blue (0-255)
 * @returns A lowercase hex string (e.g., "#ff0000").
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (value: number) => {
    const clamped = Math.max(0, Math.min(COLOR_CONSTANTS.MAX_RGB, Math.round(value)))
    return clamped.toString(COLOR_CONSTANTS.HEX_BASE).padStart(2, '0')
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toLowerCase()
}

/**
 * Parses a 6-digit hex string into RGB values.
 * @param hex A hex string (e.g., "#ff0000" or "ff0000")
 * @returns An array containing [R, G, B] or null if invalid.
 */
export function hexToRgb(hex: string): RGB | null {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!match) return null

  return [
    Number.parseInt(match[1], COLOR_CONSTANTS.HEX_BASE),
    Number.parseInt(match[2], COLOR_CONSTANTS.HEX_BASE),
    Number.parseInt(match[3], COLOR_CONSTANTS.HEX_BASE)
  ]
}

/**
 * Converts RGB color values to HSL.
 * @param r Red (0-255)
 * @param g Green (0-255)
 * @param b Blue (0-255)
 * @returns An array containing [H, S, L] values.
 */
export function rgbToHsl(r: number, g: number, b: number): HSL {
  const normalizedR = r / COLOR_CONSTANTS.MAX_RGB
  const normalizedG = g / COLOR_CONSTANTS.MAX_RGB
  const normalizedB = b / COLOR_CONSTANTS.MAX_RGB

  const max = Math.max(normalizedR, normalizedG, normalizedB)
  const min = Math.min(normalizedR, normalizedG, normalizedB)
  const delta = max - min

  const lightness = (max + min) / 2
  let hue = 0
  let saturation = 0

  if (delta !== 0) {
    saturation = lightness > COLOR_CONSTANTS.LIGHTNESS_MIDPOINT ? delta / (2 - max - min) : delta / (max + min)

    switch (max) {
      case normalizedR:
        hue = (normalizedG - normalizedB) / delta + (normalizedG < normalizedB ? COLOR_CONSTANTS.HUE_OFFSET_NEG_R : 0)
        break
      case normalizedG:
        hue = (normalizedB - normalizedR) / delta + COLOR_CONSTANTS.HUE_OFFSET_G
        break
      case normalizedB:
        hue = (normalizedR - normalizedG) / delta + COLOR_CONSTANTS.HUE_OFFSET_B
        break
    }
    hue *= COLOR_CONSTANTS.HUE_SEGMENT_DEGREES
  }

  return [hue, saturation, lightness]
}

/**
 * Determines whether black or white text is more readable on a given background color.
 * @param hex Background color in hex format
 * @returns Hex code for white or near-black text based on luminance.
 */
export function readableOn(hex: string): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return LUMINANCE_CONSTANTS.DARK_TEXT

  const calculateLuminance = (value: number) => {
    const normalized = value / COLOR_CONSTANTS.MAX_RGB
    return normalized <= LUMINANCE_CONSTANTS.SRGB_THRESHOLD
      ? normalized / LUMINANCE_CONSTANTS.SRGB_DIVISOR
      : Math.pow(
          (normalized + LUMINANCE_CONSTANTS.SRGB_OFFSET) / LUMINANCE_CONSTANTS.SRGB_SCALE,
          LUMINANCE_CONSTANTS.SRGB_GAMMA
        )
  }

  const [r, g, b] = rgb
  const luminanceR = calculateLuminance(r)
  const luminanceG = calculateLuminance(g)
  const luminanceB = calculateLuminance(b)

  const relativeLuminance =
    LUMINANCE_CONSTANTS.WEIGHT_R * luminanceR +
    LUMINANCE_CONSTANTS.WEIGHT_G * luminanceG +
    LUMINANCE_CONSTANTS.WEIGHT_B * luminanceB

  return relativeLuminance > LUMINANCE_CONSTANTS.READABLE_THRESHOLD
    ? LUMINANCE_CONSTANTS.DARK_TEXT
    : LUMINANCE_CONSTANTS.LIGHT_TEXT
}
