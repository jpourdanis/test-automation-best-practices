import { test, expect } from '../baseFixtures'

/**
 * Test Suite: UI Error Handling Coverage
 *
 * This suite verifies the application's resilience by simulating network failures
 * and edge cases using Playwright's network interception (`page.route`).
 * It ensures that the UI handles API errors gracefully without crashing and
 * provides appropriate feedback (like loading states or console logging).
 */
test.describe('UI Error Handling Coverage', () => {
  /**
   * Test: Network failure on initial colors fetch
   *
   * Simulates a total network failure when the app first tries to load the
   * available colors. Validates that the UI remains in a "Loading" state
   * rather than breaking or showing empty data.
   */
  test('should handle fetch colors network failure gracefully', async ({ homePage, page }) => {
    // Abort the initial colors fetch
    await page.route('**/api/colors', (route) => route.abort('failed'))
    await homePage.goto()

    // The UI should show "Loading colors..." because colors array is empty
    await expect(page.locator('text=Loading colors...')).toBeVisible()
  })

  /**
   * Test: Network failure on individual color click
   *
   * Simulates a failure when requesting the hex code for a specific color.
   * Verifies that the application catches the error and logs a descriptive
   * message to the console.
   */
  test('should handle color click network failure gracefully', async ({ homePage, page }) => {
    // Start normally
    await homePage.goto()

    // Abort the specific color fetch
    await page.route('**/api/colors/Turquoise', (route) => route.abort('failed'))

    // Start capture console errors
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    // We start the request listener before the action
    const requestPromise = page.waitForRequest('**/api/colors/Turquoise')

    // We use the POM locator we recently updated
    await homePage.turquoiseBtn.click()

    // Await the request to ensure it happened
    await requestPromise

    // Wait for the async catch block to execute and log the error
    await expect
      .poll(() => errors)
      .toContainEqual(expect.stringContaining('Failed to fetch hex for Turquoise'))
  })

  /**
   * Test: Empty API response
   *
   * Mocks a successful API response that returns an empty list of colors.
   * Ensures the UI handles this state correctly by showing the loading/empty message.
   */
  test('should show loading state when API returns empty colors', async ({ homePage, page }) => {
    // Mock the API to return an empty array to cover the `data.length > 0` false branch
    await page.route('**/api/colors', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    )

    // We use Playwright's waitForResponse to avoid static waits natively,
    // ensuring fast and deterministic execution.
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/colors') && resp.status() === 200
    )
    await homePage.goto()
    await responsePromise

    // The UI should show "Loading colors..." because the condition `data.length > 0` is false
    await expect(page.locator('text=Loading colors...')).toBeVisible()
  })
})
