# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/a11y.spec.ts >> i18n Accessibility Tests >> should maintain accessibility in en language and verify resilient locators
- Location: e2e/tests/a11y.spec.ts:98:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Change background to Turquoise' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: 'Change background to Turquoise' })

```

# Page snapshot

```yaml
- main [ref=e4]:
  - generic [ref=e5]:
    - combobox "Select Language" [ref=e7] [cursor=pointer]:
      - option "English" [selected]
      - option "Español"
      - option "Ελληνικά"
    - img "logo"
    - heading "Color Chooser App" [level=1] [ref=e8]
    - paragraph [ref=e9]:
      - text: Edit
      - code [ref=e10]: src/App.js
      - text: and save to reload.
    - link "Learn React" [ref=e11] [cursor=pointer]:
      - /url: https://reactjs.org
    - generic [ref=e12]: "Current color: #0AdCEa"
    - generic [ref=e13]:
      - generic [ref=e14]:
        - button "Change background to tT" [pressed] [ref=e15] [cursor=pointer]: tT
        - 'button "Remove color: tT" [ref=e17] [cursor=pointer]': ×
      - generic [ref=e18]:
        - button "Change background to tT" [pressed] [ref=e19] [cursor=pointer]: tT
        - 'button "Remove color: tT" [ref=e21] [cursor=pointer]': ×
      - generic [ref=e22]:
        - button "Change background to 2nEE" [ref=e23] [cursor=pointer]: 2nEE
        - 'button "Remove color: 2nEE" [ref=e25] [cursor=pointer]': ×
      - generic [ref=e26]:
        - button "Change background to ck3OEMw 90l7" [ref=e27] [cursor=pointer]: ck3OEMw 90l7
        - 'button "Remove color: ck3OEMw 90l7" [ref=e29] [cursor=pointer]': ×
      - generic [ref=e30]:
        - button "Change background to a" [ref=e31] [cursor=pointer]: a
        - 'button "Remove color: a" [ref=e33] [cursor=pointer]': ×
      - generic [ref=e34]:
        - button "Change background to 2" [ref=e35] [cursor=pointer]: "2"
        - 'button "Remove color: 2" [ref=e37] [cursor=pointer]': ×
      - generic [ref=e38]:
        - button "Change background to f" [ref=e39] [cursor=pointer]: f
        - 'button "Remove color: f" [ref=e41] [cursor=pointer]': ×
      - generic [ref=e42]:
        - button "Change background to tT" [pressed] [ref=e43] [cursor=pointer]: tT
        - 'button "Remove color: tT" [ref=e45] [cursor=pointer]': ×
      - generic [ref=e46]:
        - button "Change background to V" [ref=e47] [cursor=pointer]: V
        - 'button "Remove color: V" [ref=e49] [cursor=pointer]': ×
      - generic [ref=e50]:
        - button "Change background to tT" [pressed] [ref=e51] [cursor=pointer]: tT
        - 'button "Remove color: tT" [ref=e53] [cursor=pointer]': ×
      - generic [ref=e54]:
        - button "Change background to 2MmQc00DSRp" [ref=e55] [cursor=pointer]: 2MmQc00DSRp
        - 'button "Remove color: 2MmQc00DSRp" [ref=e57] [cursor=pointer]': ×
      - generic [ref=e58]:
        - button "Change background to tT" [pressed] [ref=e59] [cursor=pointer]: tT
        - 'button "Remove color: tT" [ref=e61] [cursor=pointer]': ×
      - generic [ref=e62]:
        - button "Change background to tT" [pressed] [ref=e63] [cursor=pointer]: tT
        - 'button "Remove color: tT" [ref=e65] [cursor=pointer]': ×
      - generic [ref=e66]:
        - button "Change background to 2" [ref=e67] [cursor=pointer]: "2"
        - 'button "Remove color: 2" [ref=e69] [cursor=pointer]': ×
      - generic [ref=e70]:
        - button "Change background to 2MmQc00DSRp" [ref=e71] [cursor=pointer]: 2MmQc00DSRp
        - 'button "Remove color: 2MmQc00DSRp" [ref=e73] [cursor=pointer]': ×
      - button "+ Add color" [ref=e74] [cursor=pointer]
```

# Test source

```ts
  15  |     await homePage.goto()
  16  |   })
  17  | 
  18  |   /**
  19  |    * Test: Automatically detectable accessibility issues
  20  |    *
  21  |    * Scans the initial page state for any accessibility violations, ensuring
  22  |    * that elements like headings, ARIA tags, and contrast are compliant.
  23  |    */
  24  |   test('should not have any automatically detectable accessibility issues', async ({ homePage, page }) => {
  25  |     // Wait for the main elements to render
  26  |     await expect(homePage.header).toBeVisible()
  27  | 
  28  |     // Run Axe to check for accessibility violations
  29  |     const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
  30  | 
  31  |     // Verify there are no violations
  32  |     expect(accessibilityScanResults.violations).toEqual([])
  33  |   })
  34  | 
  35  |   /**
  36  |    * Test: Accessibility after state change
  37  |    *
  38  |    * Verifies that the application remains accessible after user interactions,
  39  |    * specifically ensuring that color contrast ratios remain valid when the
  40  |    * background color changes dynamically.
  41  |    */
  42  |   test('should maintain accessibility after state change (color update)', async ({ homePage, page }) => {
  43  |     // Change color to verify contrast and other rules still pass
  44  |     await homePage.clickColorButton('Yellow')
  45  | 
  46  |     // Wait for the color change to apply (indicated by the text changing)
  47  |     await expect(homePage.currentColorText).toContainText('#f1c40f')
  48  | 
  49  |     const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
  50  | 
  51  |     // We specifically check contrast rules after a background color change
  52  |     const contrastViolations = accessibilityScanResults.violations.filter((v) => v.id === 'color-contrast')
  53  |     expect(contrastViolations).toEqual([])
  54  |   })
  55  | 
  56  |   /**
  57  |    * Test: Accessibility Score via Google Lighthouse
  58  |    *
  59  |    * Runs a full Lighthouse accessibility audit on the page. Unlike Axe,
  60  |    * Lighthouse provides a weighted score (from 0 to 100) based on multiple
  61  |    * accessibility categories. We enforce a high bar (threshold > 90) to
  62  |    * guarantee premium compliance.
  63  |    */
  64  |   test('should meet the accessibility threshold using Google Lighthouse', async ({ homePage, page }) => {
  65  |     test.skip(
  66  |       process.env.BROWSERSTACK === 'true',
  67  |       'Lighthouse audits are non-deterministic on BrowserStack cloud browsers'
  68  |     )
  69  |     // Wait for the main elements to render
  70  |     await expect(homePage.header).toBeVisible()
  71  | 
  72  |     // Run the Lighthouse audit
  73  |     await playAudit({
  74  |       page: page,
  75  |       thresholds: {
  76  |         accessibility: 90
  77  |       },
  78  |       port: 9222 + (process.env.TEST_WORKER_INDEX ? parseInt(process.env.TEST_WORKER_INDEX) : 0)
  79  |     })
  80  |   })
  81  | })
  82  | 
  83  | /**
  84  |  * Test Suite: i18n Accessibility Tests
  85  |  *
  86  |  * Demonstrates best practices for handling multiple languages without
  87  |  * relying on brittle DOM manipulation locators. By importing the language
  88  |  * JSON directly, we can use resilient user-centric locators.
  89  |  */
  90  | test.describe('i18n Accessibility Tests', () => {
  91  |   const languages = [
  92  |     { code: 'en', i18n: enTranslations },
  93  |     { code: 'es', i18n: esTranslations },
  94  |     { code: 'el', i18n: elTranslations }
  95  |   ]
  96  | 
  97  |   for (const lang of languages) {
  98  |     test(`should maintain accessibility in ${lang.code} language and verify resilient locators`, async ({
  99  |       homePage,
  100 |       page
  101 |     }) => {
  102 |       await homePage.goto()
  103 | 
  104 |       // Change the language. Default is English, so the label starts as English.
  105 |       const languageDropdown = page.getByRole('combobox', {
  106 |         name: enTranslations.languageSelector
  107 |       })
  108 |       await languageDropdown.selectOption(lang.code)
  109 | 
  110 |       // Verify page layout using dynamic, translation-aware accessibility locators!
  111 |       // This is the clean, resilient way over falling back to CSS selectors.
  112 |       await expect(page.getByRole('heading', { name: lang.i18n.title })).toBeVisible()
  113 |       await expect(
  114 |         page.getByRole('button', { name: `${lang.i18n.changeColor} ${lang.i18n.colors.turquoise}` })
> 115 |       ).toBeVisible()
      |         ^ Error: expect(locator).toBeVisible() failed
  116 |       await expect(page.getByRole('button', { name: `${lang.i18n.changeColor} ${lang.i18n.colors.red}` })).toBeVisible()
  117 |       await expect(
  118 |         page.getByRole('button', { name: `${lang.i18n.changeColor} ${lang.i18n.colors.yellow}` })
  119 |       ).toBeVisible()
  120 | 
  121 |       // Run Axe to check for accessibility violations in the translated state
  122 |       const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
  123 |       expect(accessibilityScanResults.violations).toEqual([])
  124 |     })
  125 |   }
  126 | })
  127 | 
```