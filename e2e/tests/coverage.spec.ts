import { test, expect } from '../baseFixtures'
import { convertHexToRGB, extractHexColor } from '../helper'

/**
 * Test Suite: Coverage Verification
 *
 * This suite focuses on ensuring that the basic UI functionality is covered
 * and that the background color logic works as expected. It also serves
 * as a baseline for Istanbul code coverage collection.
 */
test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

interface Color {
  name: string
  hex: string
}

const colors: Color[] = [
  { name: 'Turquoise', hex: '1abc9c' },
  { name: 'Red', hex: 'e74c3c' },
  { name: 'Yellow', hex: 'f1c40f' }
]

/**
 * Test: Verify that Turquoise is set as the default background color
 * Steps:
 * 1. Get the current color text from the page
 * 2. Extract the hex code from the current color placeholder
 * 3. Verify it matches the expected Turquoise hex code
 * 4. Convert hex to RGB for CSS validation
 * 5. Verify the header background color of the page matches the RGB values
 */
test('check Turquoise ( #1abc9c) is the default background color.', async ({ page }) => {
  const turquoiseHex = colors.find((c) => c.name === 'Turquoise')?.hex || '1abc9c'
  await expect(page.locator('text=Current color:')).toContainText(turquoiseHex)

  let rgbColors = convertHexToRGB(`#${turquoiseHex}`)
  await expect(page.locator('header')).toHaveCSS(
    'background-color',
    `rgb(${rgbColors.red}, ${rgbColors.green}, ${rgbColors.blue})`
  )
})

/**
 * Test Suite: Background color tests
 *
 * This suite iterates over each color in the `colors` array and verifies:
 * 1. Clicking the color name applies the correct background color to the header.
 * 2. The displayed current color hex matches the expected hex code.
 * 3. The header's CSS background-color matches the expected RGB value.
 */
test.describe('Background color tests', () => {
  for (const color of colors) {
    test(`verify ${color.name} ( #${color.hex} ) is applied as the background color`, async ({ page }) => {
      // Click the color name to change the background color
      await page.click(`text=${color.name}`)

      // Wait for React to fetch and update DOM
      await expect(page.locator('text=Current color:')).toContainText(color.hex)

      // Convert hex to RGB for CSS validation
      const rgb = convertHexToRGB(`#${color.hex}`)

      // Verify the header background color matches the expected RGB value
      await expect(page.locator('header')).toHaveCSS('background-color', `rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})`)
    })
  }
})

/**
 * Test: Verify language switcher correctly updates the document's lang attribute
 */
test('verify language switcher changes document language', async ({ page }) => {
  // Select Spanish
  await page.selectOption('select', 'es')
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')

  // Select Greek
  await page.selectOption('select', 'el')
  await expect(page.locator('html')).toHaveAttribute('lang', 'el')
})

/**
 * Test Suite: Edge cases and error handling for coverage
 */
test.describe('Edge cases and error handling', () => {
  test('handle initial fetch error', async ({ page }) => {
    // Mock 500 error for initial colors fetch
    await page.route('/api/colors', (route) => route.fulfill({ status: 500 }))
    await page.goto('/')
    await expect(page.locator('.error-message')).toHaveText('Failed to load colors')
  })

  test('handle initial fetch with empty data', async ({ page }) => {
    // Mock empty array response
    await page.route('/api/colors', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      })
    )
    await page.goto('/')
    await expect(page.locator('text=Loading colors...')).toBeVisible()
  })

  test('handle color selection fetch error', async ({ page }) => {
    // Mock 500 error for specific color fetch
    await page.route('/api/colors/Red', (route) => route.fulfill({ status: 500 }))
    await page.click('text=Red')
    await expect(page.locator('.error-message')).toHaveText('Failed to load color: Red')
  })

  test('handle color response missing hex property', async ({ page }) => {
    // Mock response missing hex property
    await page.route('/api/colors/Yellow', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ name: 'Yellow' })
      })
    )
    await page.click('text=Yellow')
    // Expect no crash and current color text to remain unchanged (or still be default)
    await expect(page.locator('text=Current color:')).not.toContainText('undefined')
  })
})
