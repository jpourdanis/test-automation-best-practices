import { test, expect } from '../baseFixtures';
import enTranslations from '../../src/locales/en.json';

/**
 * Test Suite: Network Mocking & Interception
 *
 * Demonstrates how to intercept and mock network requests within Playwright
 * to simulate different application states (like missing assets or edge cases)
 * without relying on a real backend.
 */
test.describe('Network Mocking & Interception', () => {
  // homePage is now provided via the baseFixtures fixture

  /**
   * Test: Handle missing image gracefully
   *
   * Intercepts the request for the 'logo.svg' asset and forcibly aborts it.
   * Validates that the application handles the failure gracefully by displaying
   * the alternative "alt" text as a fallback.
   */
  test('should handle missing image gracefully by showing alt text', async ({ homePage, page }) => {
    // Intercept requests for the logo and abort them
    await page.route('**/logo.svg', (route) => route.abort());

    // Now go to the page
    await homePage.goto();

    // The image won't load, but it should still be in the DOM
    const logoImg = page.getByRole('img', { name: 'logo' });

    // We expect the image element to exist
    await expect(logoImg).toBeVisible();

    // And verify the alt text is present for screen readers/fallback
    await expect(logoImg).toHaveAttribute('alt', 'logo');
  });

  /**
   * Test: Mock API response with non-existent data
   *
   * Demonstrates how to fulfill an intercepted request with mock JSON data
   * that doesn't exist in the real database.
   */
  test('should display colors that do not exist in the database', async ({ homePage, page }) => {
    // Intercept the initial colors fetch and provide custom mock data
    await page.route('**/api/colors', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ name: 'Magenta', hex: '#ff00ff' }]),
      });
    });

    // Intercept the specific color fetch
    await page.route('**/api/colors/Magenta', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ name: 'Magenta', hex: '#ff00ff' }),
      });
    });

    await homePage.goto();

    // The button for our mocked color should be visible
    const customBtn = page.getByRole('button', { name: 'colors.magenta' });
    await expect(customBtn).toBeVisible();

    // Click the mocked color button
    await customBtn.click();

    // Verify the background color changes to our mocked hex value
    await expect(homePage.header).toHaveCSS('background-color', 'rgb(255, 0, 255)');
  });

  /**
   * Test: Handle color not found in the database
   *
   * Demonstrates mocking an API error response (e.g. 404 Not Found)
   * and verifying that the application handles it gracefully.
   */
  test('should gracefully handle a color not found in the database', async ({ homePage, page }) => {
    // Verify that the UI handles a 404 gracefully without changing the background
    await page.route('**/api/colors', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { name: 'Turquoise', hex: '#1abc9c' },
          { name: 'Red', hex: '#e74c3c' },
        ]),
      });
    });

    // Intercept the request for 'Red' and simulate a 404 Not Found response
    await page.route('**/api/colors/Red', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Color not found' }),
      });
    });

    await homePage.goto();

    // The background should initially be the first color (Turquoise: #1abc9c / rgb(26, 188, 156))
    await expect(homePage.header).toHaveCSS('background-color', 'rgb(26, 188, 156)');

    // Attempt to click the 'Red' button, which will trigger the 404
    const redBtn = page.getByRole('button', { name: enTranslations.colors.red });
    await redBtn.click();

    // The background color should not have changed, since the fetch failed
    await expect(homePage.header).toHaveCSS('background-color', 'rgb(26, 188, 156)');
  });
});
