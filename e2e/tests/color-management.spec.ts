import { test, expect } from '../baseFixtures'

const INITIAL_COLORS = [
  { name: 'Turquoise', hex: '#1abc9c' },
  { name: 'Red', hex: '#e74c3c' },
  { name: 'Yellow', hex: '#f1c40f' }
]

/**
 * Mock the GET /api/colors list endpoint with the given array.
 * Any prior route registration for the same pattern is overridden per Playwright's last-match rule.
 */
async function mockColorList(page: any, colors = INITIAL_COLORS) {
  await page.route('**/api/colors', async (route: any) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(colors) })
    } else {
      await route.continue()
    }
  })
}

/**
 * Test Suite: Color Management (Add & Delete)
 *
 * Uses Playwright route mocking to exercise the full add/delete UI flow
 * without mutating a real database.
 */
test.describe('Color Management — Add & Delete', () => {
  test.beforeEach(async ({ page }) => {
    await mockColorList(page)
  })

  // ── chips & active state ─────────────────────────────────────────────────

  test('shows a chip for each color with a swatch, name, and delete button', async ({ homePage, page }) => {
    await homePage.goto()

    for (const color of INITIAL_COLORS) {
      await expect(page.getByRole('button', { name: `Change background to ${color.name}`, exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: `Remove color: ${color.name}`, exact: true })).toBeVisible()
    }
  })

  test('first color chip is active on load (aria-pressed=true)', async ({ homePage, page }) => {
    await homePage.goto()
    const firstBtn = page.getByRole('button', { name: 'Change background to Turquoise', exact: true })
    await expect(firstBtn).toHaveAttribute('aria-pressed', 'true')
  })

  test('clicking a chip makes it active', async ({ homePage, page }) => {
    await page.route('**/api/colors/Red', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ name: 'Red', hex: '#e74c3c' })
      })
    })
    await homePage.goto()

    await homePage.clickColorButton('Red')

    await expect(page.getByRole('button', { name: 'Change background to Red', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    await expect(homePage.header).toHaveCSS('background-color', 'rgb(231, 76, 60)')
  })

  // ── add color picker ─────────────────────────────────────────────────────

  test('clicking "+ Add color" opens the picker modal', async ({ homePage, page }) => {
    await homePage.goto()
    await homePage.openColorPicker()

    await expect(homePage.pickerCard).toBeVisible()
    await expect(page.locator('.wheel-canvas')).toBeVisible()
    await expect(homePage.pickerNameInput).toBeVisible()
  })

  test('Cancel button closes the picker', async ({ homePage }) => {
    await homePage.goto()
    await homePage.openColorPicker()
    await homePage.pickerCancelBtn.click()
    await expect(homePage.pickerCard).not.toBeVisible()
  })

  test('close (×) button closes the picker', async ({ homePage, page }) => {
    await homePage.goto()
    await homePage.openColorPicker()
    await page.getByRole('button', { name: 'Close', exact: true }).click()
    await expect(homePage.pickerCard).not.toBeVisible()
  })

  test('clicking the backdrop closes the picker', async ({ homePage, page }) => {
    await homePage.goto()
    await homePage.openColorPicker()
    // Click in the backdrop area (outside the card) using the backdrop element directly
    await page.locator('.picker-backdrop').click({ position: { x: 5, y: 5 } })
    await expect(homePage.pickerCard).not.toBeVisible()
  })

  // ── add color: success ───────────────────────────────────────────────────

  test('successfully adds a new color and shows its chip', async ({ homePage, page }) => {
    const OCEAN = { name: 'Ocean', hex: '#0077be' }
    const updatedList = [...INITIAL_COLORS, OCEAN]

    await page.route('**/api/colors', async (route: any) => {
      const method = route.request().method()
      if (method === 'POST') {
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(OCEAN) })
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(updatedList) })
      }
    })

    await homePage.goto()
    await homePage.openColorPicker()
    await homePage.pickerNameInput.fill('Ocean')
    await homePage.pickerSubmitBtn.click()

    await expect(homePage.pickerCard).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Change background to Ocean', exact: true })).toBeVisible()
    // background should switch to the new color
    await expect(homePage.header).toHaveCSS('background-color', 'rgb(0, 119, 190)')
  })

  // ── add color: validation errors ─────────────────────────────────────────

  test('shows client-side "Name is required" when submitting empty name', async ({ homePage }) => {
    await homePage.goto()
    await homePage.openColorPicker()
    await homePage.pickerSubmitBtn.click()
    await expect(homePage.pickerCard.getByText('Name is required')).toBeVisible()
  })

  test('shows client-side validation error for invalid name chars', async ({ homePage }) => {
    await homePage.goto()
    await homePage.openColorPicker()
    await homePage.pickerNameInput.fill('!!!invalid')
    await homePage.pickerSubmitBtn.click()
    await expect(homePage.pickerCard.getByText('Letters, numbers, spaces, + only')).toBeVisible()
  })

  // ── add color: server errors ─────────────────────────────────────────────

  test('shows 409 duplicate error from server inside the picker', async ({ homePage, page }) => {
    await page.route('**/api/colors', async (route: any) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Color "Unique" already exists' })
        })
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(INITIAL_COLORS) })
      }
    })

    await homePage.goto()
    await homePage.openColorPicker()
    await homePage.pickerNameInput.fill('Unique')
    await homePage.pickerSubmitBtn.click()

    await expect(homePage.pickerCard.getByRole('alert')).toContainText('Color "Unique" already exists')
    // picker stays open so the user can correct the name
    await expect(homePage.pickerCard).toBeVisible()
  })

  test('shows server-error message on 500 inside the picker', async ({ homePage, page }) => {
    await page.route('**/api/colors', async (route: any) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({}) })
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(INITIAL_COLORS) })
      }
    })

    await homePage.goto()
    await homePage.openColorPicker()
    await homePage.pickerNameInput.fill('Unique')
    await homePage.pickerSubmitBtn.click()

    await expect(homePage.pickerCard.getByRole('alert')).toContainText('Server error. Please try again.')
  })

  // ── delete color ─────────────────────────────────────────────────────────

  test('chip-x click opens confirm dialog with color name', async ({ homePage, page }) => {
    await homePage.goto()
    await homePage.clickDeleteChip('Red')

    await expect(homePage.confirmCard).toBeVisible()
    await expect(page.getByText('Delete color?')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Delete', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible()
  })

  test('cancel in confirm dialog closes it without deleting', async ({ homePage }) => {
    await homePage.goto()
    await homePage.clickDeleteChip('Red')
    await homePage.confirmCancelBtn.click()

    await expect(homePage.confirmCard).not.toBeVisible()
    await expect(homePage.redBtn).toBeVisible()
  })

  test('Escape key closes the confirm dialog', async ({ homePage, page }) => {
    await homePage.goto()
    await homePage.clickDeleteChip('Red')
    await page.keyboard.press('Escape')
    await expect(homePage.confirmCard).not.toBeVisible()
  })

  test('successful delete removes the chip', async ({ homePage, page }) => {
    const remaining = [INITIAL_COLORS[0], INITIAL_COLORS[2]]

    await page.route('**/api/colors/Red', async (route: any) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'deleted' })
        })
      } else {
        await route.continue()
      }
    })
    // After delete, GET /api/colors returns two colors
    let callCount = 0
    await page.route('**/api/colors', async (route: any) => {
      callCount++
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(callCount === 1 ? INITIAL_COLORS : remaining)
      })
    })

    await homePage.goto()
    await homePage.deleteColor('Red')

    await expect(homePage.confirmCard).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Change background to Red', exact: true })).not.toBeVisible()
    await expect(homePage.turquoiseBtn).toBeVisible()
    await expect(homePage.yellowBtn).toBeVisible()
  })

  test('deleting the active color switches background to the first remaining', async ({ homePage, page }) => {
    const remaining = [INITIAL_COLORS[1], INITIAL_COLORS[2]] // Red, Yellow

    await page.route('**/api/colors/Turquoise', async (route: any) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'deleted' })
        })
      } else {
        await route.continue()
      }
    })
    let callCount = 0
    await page.route('**/api/colors', async (route: any) => {
      callCount++
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(callCount === 1 ? INITIAL_COLORS : remaining)
      })
    })

    await homePage.goto()
    // Turquoise is active by default
    await expect(homePage.header).toHaveCSS('background-color', 'rgb(26, 188, 156)')

    await homePage.deleteColor('Turquoise')

    // Background switches to Red (first remaining)
    await expect(homePage.header).toHaveCSS('background-color', 'rgb(231, 76, 60)')
  })

  test('delete API error shows alert banner', async ({ homePage, page }) => {
    await page.route('**/api/colors/Red', async (route: any) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'DB error' })
        })
      } else {
        await route.continue()
      }
    })

    await homePage.goto()
    await homePage.clickDeleteChip('Red')
    await homePage.confirmDeleteBtn.click()

    await expect(page.getByRole('alert')).toContainText('DB error')
  })
})
