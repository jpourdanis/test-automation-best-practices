# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/a11y.spec.ts >> i18n Accessibility Tests >> should maintain accessibility in en language and verify resilient locators
- Location: e2e/tests/a11y.spec.ts:106:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Change background to Yellow' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: 'Change background to Yellow' })

```

```yaml
- main:
  - combobox "Select Language":
    - option "English" [selected]
    - option "Español"
    - option "Ελληνικά"
  - img "logo"
  - heading "Color Chooser App" [level=1]
  - paragraph:
    - text: Edit
    - code: src/App.js
    - text: and save to reload.
  - link "Learn React":
    - /url: https://reactjs.org
  - text: "Current color: #1abc9c"
  - button "Change background to Red": Red
  - 'button "Remove color: Red"': ×
  - button "Change background to Turquoise" [pressed]: Turquoise
  - 'button "Remove color: Turquoise"': ×
  - button "+ Add color"
```

# Test source

```ts
  22  |    *
  23  |    * Scans the initial page state for any accessibility violations, ensuring
  24  |    * that elements like headings, ARIA tags, and contrast are compliant.
  25  |    */
  26  |   test('should not have any automatically detectable accessibility issues', async ({ homePage, page }) => {
  27  |     // Wait for the main elements to render
  28  |     await expect(homePage.header).toBeVisible()
  29  | 
  30  |     // Run Axe to check for accessibility violations
  31  |     const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
  32  | 
  33  |     // Verify there are no violations
  34  |     expect(accessibilityScanResults.violations).toEqual([])
  35  |   })
  36  | 
  37  |   /**
  38  |    * Test: Accessibility after state change
  39  |    *
  40  |    * Verifies that the application remains accessible after user interactions,
  41  |    * specifically ensuring that color contrast ratios remain valid when the
  42  |    * background color changes dynamically.
  43  |    */
  44  |   test('should maintain accessibility after state change (color update)', async ({ homePage, page }) => {
  45  |     // Change color to verify contrast and other rules still pass
  46  |     await homePage.clickColorButton('Yellow')
  47  | 
  48  |     // Wait for the color change to apply (indicated by the text changing)
  49  |     await expect(homePage.currentColorText).toContainText('#f1c40f')
  50  | 
  51  |     const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
  52  | 
  53  |     // We specifically check contrast rules after a background color change
  54  |     const contrastViolations = accessibilityScanResults.violations.filter((v) => v.id === 'color-contrast')
  55  |     expect(contrastViolations).toEqual([])
  56  |   })
  57  | 
  58  |   /**
  59  |    * Test: Accessibility Score via Google Lighthouse
  60  |    *
  61  |    * Runs a full Lighthouse accessibility audit on the page. Unlike Axe,
  62  |    * Lighthouse provides a weighted score (from 0 to 100) based on multiple
  63  |    * accessibility categories. We enforce a high bar (threshold > 90) to
  64  |    * guarantee premium compliance.
  65  |    */
  66  |   test('should meet the accessibility threshold using Google Lighthouse', async ({ homePage, page }) => {
  67  |     test.skip(
  68  |       process.env.BROWSERSTACK === 'true',
  69  |       'Lighthouse audits are non-deterministic on BrowserStack cloud browsers'
  70  |     )
  71  |     // Wait for the main elements to render
  72  |     await expect(homePage.header).toBeVisible()
  73  | 
  74  |     // Run the Lighthouse audit
  75  |     await playAudit({
  76  |       page: page,
  77  |       thresholds: {
  78  |         accessibility: 90
  79  |       },
  80  |       port: 9222 + (process.env.TEST_WORKER_INDEX ? Number.parseInt(process.env.TEST_WORKER_INDEX) : 0)
  81  |     })
  82  |   })
  83  | })
  84  | 
  85  | /**
  86  |  * Test Suite: i18n Accessibility Tests
  87  |  *
  88  |  * Demonstrates best practices for handling multiple languages without
  89  |  * relying on brittle DOM manipulation locators. By importing the language
  90  |  * JSON directly, we can use resilient user-centric locators.
  91  |  */
  92  | test.describe('i18n Accessibility Tests', () => {
  93  |   const languages = [
  94  |     { code: 'en', i18n: enTranslations },
  95  |     { code: 'es', i18n: esTranslations },
  96  |     { code: 'el', i18n: elTranslations }
  97  |   ]
  98  | 
  99  |   test.beforeEach(async ({ homePage }) => {
  100 |     await homePage.goto()
  101 |     await homePage.clickColorButton('Turquoise')
  102 |     await expect(homePage.currentColorText).toContainText('#1abc9c')
  103 |   })
  104 | 
  105 |   for (const lang of languages) {
  106 |     test(`should maintain accessibility in ${lang.code} language and verify resilient locators`, async ({ page }) => {
  107 |       // Change the language. Default is English, so the label starts as English.
  108 |       const languageDropdown = page.getByRole('combobox', {
  109 |         name: enTranslations.languageSelector
  110 |       })
  111 |       await languageDropdown.selectOption(lang.code)
  112 | 
  113 |       // Verify page layout using dynamic, translation-aware accessibility locators!
  114 |       // This is the clean, resilient way over falling back to CSS selectors.
  115 |       await expect(page.getByRole('heading', { name: lang.i18n.title })).toBeVisible()
  116 |       await expect(
  117 |         page.getByRole('button', { name: `${lang.i18n.changeColor} ${lang.i18n.colors.turquoise}` })
  118 |       ).toBeVisible()
  119 |       await expect(page.getByRole('button', { name: `${lang.i18n.changeColor} ${lang.i18n.colors.red}` })).toBeVisible()
  120 |       await expect(
  121 |         page.getByRole('button', { name: `${lang.i18n.changeColor} ${lang.i18n.colors.yellow}` })
> 122 |       ).toBeVisible()
      |         ^ Error: expect(locator).toBeVisible() failed
  123 | 
  124 |       // Run Axe to check for accessibility violations in the translated state
  125 |       const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
  126 |       expect(accessibilityScanResults.violations).toEqual([])
  127 |     })
  128 |   }
  129 | })
  130 | 
```