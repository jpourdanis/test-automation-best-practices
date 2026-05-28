import * as crypto from 'node:crypto'
import type { APIRequestContext } from '@playwright/test'

/**
 * Calls POST /api/reseed with the RESEED_API_TOKEN env var to restore the
 * database to its default seed state (Turquoise, Red, Yellow).
 * Use in beforeEach / beforeAll hooks for suites that mutate or depend on
 * the exact set of seed colors.
 */
export async function reseedDatabase(request: APIRequestContext): Promise<void> {
  const token = process.env.RESEED_API_TOKEN
  if (!token) throw new Error('RESEED_API_TOKEN is not set — add it to server/.env or set it in the environment')
  const res = await request.post('/api/reseed', {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok()) {
    throw new Error(`reseedDatabase failed: HTTP ${res.status()} — ${await res.text()}`)
  }
}
/**
 * Converts a hexadecimal color string to RGB values
 * @param hex - The hexadecimal color string (with or without '#' prefix)
 * @returns An object containing the RGB values
 * @example
 * convertHexToRGB('#1abc9c') // returns { red: 26, green: 188, blue: 156 }
 * convertHexToRGB('1abc9c')  // returns { red: 26, green: 188, blue: 156 }
 */
export function convertHexToRGB(hex: string) {
  // Remove the '#' if it's included in the input
  hex = hex.replace(/^#/, '')

  // Parse the hex values into separate R, G, and B values
  const red = Number.parseInt(hex.substring(0, 2), 16)
  const green = Number.parseInt(hex.substring(2, 4), 16)
  const blue = Number.parseInt(hex.substring(4, 6), 16)

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
export function extractHexColor(text: string) {
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
