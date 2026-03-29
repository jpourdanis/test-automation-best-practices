import * as crypto from 'crypto'
/**
 * Converts a hexadecimal color string to RGB values
 * @param hex - The hexadecimal color string (with or without '#' prefix)
 * @returns An object containing the RGB values
 * @example
 * convertHexToRGB('#1abc9c') // returns { red: 26, green: 188, blue: 156 }
 * convertHexToRGB('1abc9c')  // returns { red: 26, green: 188, blue: 156 }
 */
export function convertHexToRGB(hex: any) {
  // Remove the '#' if it's included in the input
  hex = hex.replace(/^#/, '')

  // Parse the hex values into separate R, G, and B values
  const red = parseInt(hex.substring(0, 2), 16)
  const green = parseInt(hex.substring(2, 4), 16)
  const blue = parseInt(hex.substring(4, 6), 16)

  // Return the RGB values in an object
  return {
    red: red,
    green: green,
    blue: blue
  }
}

/**
 * Extracts a hexadecimal color code from a text string
 * @param text - The text string containing a hex color code (format: #XXXXXX)
 * @returns The hex color code without the '#' prefix, or null if no valid hex color is found
 * @example
 * extractHexColor('Current color: #1abc9c') // returns '1abc9c'
 * extractHexColor('No color here')          // returns null
 */
export function extractHexColor(text: any) {
  const hexMatch = text.match(/#([0-9a-fA-F]{6})/)
  if (hexMatch) {
    return hexMatch[1]
  }
  return null
}

/**
 * Generates a unique identifier for coverage files
 * @returns A 32-character hexadecimal string
 * @example generateUUID() // returns "1a2b3c4d5e6f7890..."
 */
export function generateUUID(): string {
  return crypto.randomBytes(16).toString('hex')
}
