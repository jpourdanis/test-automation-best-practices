import { test, expect } from '../baseFixtures'

/**
 * Test Suite: Cross-Browser Testing Demonstration
 *
 * This suite serves as a demonstration of cross-browser compatibility testing.
 * The best practice for cross-browser testing is NOT to run every single test
 * suite across every browser (which massively inflates CI execution time),
 * but to run primary tests on a fast, modern browser (Chromium) and run
 * a dedicated subset of cross-browser tests (or full suites on nightly runs)
 * using a conditional flag.
 *
 * In `playwright.config.ts`, the Firefox and WebKit projects are conditionally
 * injected only if `process.env.CROSS_BROWSER === "true"`. This guarantees
 * standard `npm test` runs are fast, while `npm run test:cross-browser`
 * provides deep compatibility confidence.
 */
test.describe('Cross-Browser Core Functionality', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto()
  })

  test('should load the application and verify core functionality across browsers', async ({
    homePage
  }) => {
    // Verify core UI loads
    await expect(homePage.header).toBeVisible()
    await expect(homePage.currentColorText).toBeVisible()

    // Verify interactivity works across different browser engines
    await homePage.clickColorButton('Yellow')
    await expect(homePage.currentColorText).toContainText('#f1c40f')
  })
})
