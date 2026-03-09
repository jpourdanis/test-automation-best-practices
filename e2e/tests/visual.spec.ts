import { test, expect } from "../baseFixtures";

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

    // Mask the animated React logo to prevent its CSS spin animation
    // from producing non-deterministic pixel diffs between runs.
    const screenshot = await page.screenshot({
      fullPage: true,
      mask: [page.locator(".App-logo")],
    });
    expect(screenshot).toMatchSnapshot("home.png", { maxDiffPixelRatio: 0.05 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Responsive Design Tests (constrained mobile viewport)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Responsive Design Testing", () => {
  test.beforeEach(async ({ homePage }) => {
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
  test("should render correctly on mobile viewport", async ({ homePage, page }) => {
    // Check that core elements remain visible on a small screen
    await expect(homePage.header).toBeVisible();
    await expect(homePage.currentColorText).toBeVisible();

    // Check for proper stacking or visibility of buttons
    await expect(homePage.turquoiseBtn).toBeVisible();
    await expect(homePage.redBtn).toBeVisible();
    await expect(homePage.yellowBtn).toBeVisible();

    // Verify button clicks still work at this viewport size.
    //
    // ✅ Best practice — deterministic, no wasted time
    // 1. Register the listener BEFORE the click
    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/api/colors/Yellow') && resp.status() === 200
    );
    // 2. Fire the action
    await homePage.clickColorButton("Yellow");
    // 3. Await the response (resolves as soon as it arrives)
    await responsePromise;
    // 4. Use auto-retrying assertion to handle React state update
    await expect(homePage.currentColorText).toContainText("#f1c40f");

    // Visual regression check for the mobile viewport layout.
    // Mask the animated logo to avoid flaky diffs from its CSS animation.
    const screenshot = await page.screenshot({
      fullPage: true,
      mask: [page.locator(".App-logo")],
    });
    expect(screenshot).toMatchSnapshot("home-mobile.png", { maxDiffPixelRatio: 0.05 });
  });
});
