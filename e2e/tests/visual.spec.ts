import { test, expect } from "../baseFixtures";
import { HomePage } from "../pages/HomePage";

/**
 * Test Suite: Visual Regression & Responsive Design Testing
 *
 * This suite combines two complementary testing practices:
 *
 * 1. Visual Regression — Captures full-page screenshots and compares them
 *    pixel-by-pixel against approved baselines to catch unintended layout
 *    or styling changes.
 *
 * 2. Responsive Design — Simulates smaller viewports (e.g., iPhone SE) to
 *    verify that all critical UI elements remain visible, properly stacked,
 *    and functional on mobile devices.
 *
 * Note: Visual regression baselines should be generated inside Docker to
 * avoid OS-specific rendering differences (fonts, anti-aliasing, etc.).
 */

// ─────────────────────────────────────────────────────────────────────────────
// Visual Regression Tests (default desktop viewport from playwright.config.ts)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Visual Regression", () => {
  /**
   * Test: Homepage visual baseline
   *
   * Takes a full-page screenshot of the homepage in its default state and
   * compares it against the stored baseline (`e2e/snapshots/home.png`).
   * Any pixel difference will cause the test to fail, highlighting exactly
   * what changed in a visual diff report.
   */
  test("homepage should match snapshot", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("header");

    const screenshot = await page.screenshot({ fullPage: true });
    expect(screenshot).toMatchSnapshot("home.png");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Responsive Design Tests (constrained mobile viewport)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Responsive Design Testing", () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  // Simulate an iPhone SE viewport (375×667)
  test.use({ viewport: { width: 375, height: 667 } });

  /**
   * Test: Render correctly on mobile viewport
   *
   * Runs the test within an iPhone SE viewport (375×667). Validates that
   * critical UI components (header, color text, all buttons) remain visible
   * and functional despite strict space constraints. Also verifies that
   * clicking a color button still updates the displayed hex value.
   */
  test("should render correctly on mobile viewport", async ({ page }) => {
    // Check that core elements remain visible on a small screen
    await expect(homePage.header).toBeVisible();
    await expect(homePage.currentColorText).toBeVisible();

    // Check for proper stacking or visibility of buttons
    await expect(homePage.turquoiseBtn).toBeVisible();
    await expect(homePage.redBtn).toBeVisible();
    await expect(homePage.yellowBtn).toBeVisible();

    // Verify button clicks still work at this viewport size.
    //
    // Best practice: avoid static waits (page.waitForTimeout).
    // Instead, register a response listener BEFORE the click, then click, then
    // await the response. This ensures we never miss the network event and the
    // test is deterministic regardless of how fast or slow the API responds.
    await homePage.clickColorButton("Yellow");
    await page.waitForResponse(
      resp => resp.url().includes('/api/colors/Yellow') && resp.status() === 200
    );
    // Auto-retrying assertion waits for React to update the DOM with the new color
    await expect(homePage.currentColorText).toContainText("#f1c40f");

    // Visual regression check for the mobile viewport layout
    const screenshot = await page.screenshot({ fullPage: true });
    expect(screenshot).toMatchSnapshot("home-mobile.png");
  });
});
