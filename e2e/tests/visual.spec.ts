import { test, expect } from '../baseFixtures'
import { percySnapshot } from '@percy/playwright'

/**
 * Test Suite: Visual Regression & Responsive Design Testing
 *
 * 1. Visual Regression — Captures full-page screenshots at multiple viewport sizes
 *    and compares them pixel-by-pixel against approved baselines to catch unintended
 *    layout or styling changes.
 *
 * 2. Responsive Design — Simulates constrained viewports to verify that all critical
 *    UI elements remain visible, properly stacked, and functional across device sizes.
 *
 * 3. Percy Visual Regression (Production) — Integrates with Percy.io for continuous
 *    visual monitoring on production environment with cloud-based comparison and
 *    team collaboration features.
 *
 * Note: Visual regression baselines must be generated inside Docker to avoid
 * OS-specific rendering differences (fonts, anti-aliasing, sub-pixel rendering).
 * Run: npm run test:e2e:docker:update
 *
 * Percy snapshots are captured when PERCY_TOKEN is set and running against production.
 * Run: PERCY_TOKEN=your_token npm run test:visual:percy
 */

// ---------------------------------------------------------------------------
// Viewport definitions
// ---------------------------------------------------------------------------

// Default-state snapshots: one per viewport, taken before any interaction.
const snapshotViewports = [
  { label: 'desktop', width: 1280, height: 720, snapshot: 'home.png' },
  { label: 'desktop-xl', width: 1920, height: 1080, snapshot: 'home-desktop-xl.png' },
  { label: 'tablet', width: 768, height: 1024, snapshot: 'home-tablet.png' },
  { label: 'iphone-se', width: 375, height: 667, snapshot: 'home-iphone-se.png' },
  { label: 'iphone-landscape', width: 667, height: 375, snapshot: 'home-iphone-landscape.png' }
]

// Post-interaction snapshots: taken after clicking Yellow, proving layout holds after state change.
const responsiveViewports = [
  { label: 'tablet (768×1024)', width: 768, height: 1024, snapshot: 'home-tablet-responsive.png' },
  { label: 'iPhone SE (375×667)', width: 375, height: 667, snapshot: 'home-mobile.png' },
  { label: 'iPhone landscape (667×375)', width: 667, height: 375, snapshot: 'home-iphone-landscape-responsive.png' }
]

// ─────────────────────────────────────────────────────────────────────────────
// Visual Regression — one describe per viewport so test.use() scopes correctly
// ─────────────────────────────────────────────────────────────────────────────

for (const vp of snapshotViewports) {
  test.describe(`Visual Regression – ${vp.label} (${vp.width}×${vp.height})`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } })

    /**
     * Takes a full-page screenshot at this viewport size and compares it against
     * the stored baseline. The animated React logo is masked to prevent
     * non-deterministic pixel diffs from its CSS spin animation.
     */
    test('homepage should match snapshot', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === 'percy', 'Skipping local snapshots during Percy run')
      await page.goto('/')
      await page.waitForSelector('header')

      const screenshot = await page.screenshot({
        fullPage: true,
        mask: [page.locator('.App-logo')]
      })
      expect(screenshot).toMatchSnapshot(vp.snapshot, { maxDiffPixelRatio: 0.05 })
    })
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Responsive Design — functional checks on constrained viewports
// ─────────────────────────────────────────────────────────────────────────────

for (const vp of responsiveViewports) {
  test.describe(`Responsive Design – ${vp.label}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } })

    test.beforeEach(async ({ homePage }) => {
      await homePage.goto()
    })

    /**
     * Verifies that all core UI elements (header, color display, all three color
     * buttons) are visible and that clicking a color button correctly updates the
     * hex display — confirming interactivity is not broken at this viewport size.
     * A post-interaction snapshot is captured to catch any layout regressions
     * that only appear after a state change (e.g., color update reflow).
     */
    test('should display all core elements and handle button interaction', async ({ homePage, page }, testInfo) => {
      test.skip(testInfo.project.name === 'percy', 'Skipping local snapshots during Percy run')
      await expect(homePage.header).toBeVisible()
      await expect(homePage.currentColorText).toBeVisible()
      await expect(homePage.turquoiseBtn).toBeVisible()
      await expect(homePage.redBtn).toBeVisible()
      await expect(homePage.yellowBtn).toBeVisible()

      // Register listener before the action — deterministic, no static waits
      const responsePromise = page.waitForResponse(
        (resp) => resp.url().includes('/api/colors/Yellow') && resp.status() === 200
      )
      await homePage.clickColorButton('Yellow')
      await responsePromise

      await expect(homePage.currentColorText).toContainText('#f1c40f')
      await expect(homePage.header).toHaveCSS('background-color', 'rgb(241, 196, 15)')

      const screenshot = await page.screenshot({
        fullPage: true,
        mask: [page.locator('.App-logo')]
      })
      expect(screenshot).toMatchSnapshot(vp.snapshot, { maxDiffPixelRatio: 0.05 })
    })
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Percy Visual Regression (Production) — Cloud-based visual testing on production URL
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Percy Visual Regression – Production', () => {
  test.skip(
    !process.env.PERCY_TOKEN,
    'Skipping Percy tests — PERCY_TOKEN not set. Set it to enable visual regression testing.'
  )

  const percyViewports = [
    { label: 'desktop', width: 1280, height: 720 },
    { label: 'desktop-xl', width: 1920, height: 1080 },
    { label: 'tablet', width: 768, height: 1024 },
    { label: 'mobile', width: 375, height: 667 }
  ]

  for (const vp of percyViewports) {
    test.describe(`Percy – ${vp.label} (${vp.width}×${vp.height})`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } })

      test.beforeEach(async ({ page }) => {
        // Wait for network idle to ensure app is fully loaded before capturing
        await page.goto('/')
        await page.waitForSelector('header')
        await page.waitForLoadState('networkidle')
      })

      /**
       * Captures a Percy snapshot of the homepage at this viewport size.
       * Percy compares it against previous versions and detects visual changes.
       * Snapshots are uploaded to Percy.io for team review and approval.
       */
      test('homepage initial state', async ({ page }) => {
        await percySnapshot(page, `Homepage – ${vp.label}`, {
          widths: [vp.width]
        })
      })

      /**
       * Captures a Percy snapshot after interacting with the Yellow color button.
       * This ensures visual changes from state updates are caught and reviewed.
       */
      test('homepage after color change', async ({ page, homePage }) => {
        const responsePromise = page.waitForResponse(
          (resp) => resp.url().includes('/api/colors/Yellow') && resp.status() === 200
        )
        await homePage.clickColorButton('Yellow')
        await responsePromise
        await page.waitForLoadState('networkidle')

        await percySnapshot(page, `Homepage with Yellow – ${vp.label}`, {
          widths: [vp.width]
        })
      })
    })
  }

  /**
   * Responsive design verification on mobile with Percy.
   * Ensures all UI elements remain functional and visible after state changes.
   */
  test.describe('Percy – Mobile Interactions', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test('mobile color picker workflow', async ({ page, homePage }) => {
      await homePage.goto()
      await page.waitForLoadState('networkidle')

      // Snapshot initial state
      await percySnapshot(page, 'Mobile – Initial State', { widths: [375] })

      // Interact with color picker
      const responsePromise = page.waitForResponse(
        (resp) => resp.url().includes('/api/colors/Red') && resp.status() === 200
      )
      await homePage.clickColorButton('Red')
      await responsePromise
      await page.waitForLoadState('networkidle')

      // Snapshot after interaction
      await percySnapshot(page, 'Mobile – After Red Selection', { widths: [375] })
    })
  })
})
