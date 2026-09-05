# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/coverage.spec.ts >> Edge cases and error handling >> handle color response missing hex property
- Location: e2e/tests/coverage.spec.ts:124:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=Yellow')

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
    - alert [ref=e9]: Failed to load colors
    - paragraph [ref=e10]:
      - text: Edit
      - code [ref=e11]: src/App.js
      - text: and save to reload.
    - link "Learn React" [ref=e12]:
      - /url: https://reactjs.org
    - generic [ref=e13]: "Current color: #1abc9c"
    - generic [ref=e14]:
      - paragraph [ref=e15]: Loading colors...
      - button "+ Add color" [ref=e16] [cursor=pointer]
```

# Test source

```ts
  33  |  * 5. Verify the header background color of the page matches the RGB values
  34  |  */
  35  | test('check Turquoise ( #1abc9c) is the default background color.', async ({ page }) => {
  36  |   await page.route('**/api/colors', (route) =>
  37  |     route.fulfill({
  38  |       status: 200,
  39  |       contentType: 'application/json',
  40  |       body: JSON.stringify(colors)
  41  |     })
  42  |   )
  43  |   await page.goto('/')
  44  |   const turquoiseHex = colors.find((c) => c.name === 'Turquoise')?.hex || '1abc9c'
  45  |   await expect(page.locator('text=Current color:')).toContainText(turquoiseHex)
  46  | 
  47  |   let rgbColors = convertHexToRGB(`#${turquoiseHex}`)
  48  |   await expect(page.locator('header')).toHaveCSS(
  49  |     'background-color',
  50  |     `rgb(${rgbColors.red}, ${rgbColors.green}, ${rgbColors.blue})`
  51  |   )
  52  | })
  53  | 
  54  | /**
  55  |  * Test Suite: Background color tests
  56  |  *
  57  |  * This suite iterates over each color in the `colors` array and verifies:
  58  |  * 1. Clicking the color name applies the correct background color to the header.
  59  |  * 2. The displayed current color hex matches the expected hex code.
  60  |  * 3. The header's CSS background-color matches the expected RGB value.
  61  |  */
  62  | test.describe('Background color tests', () => {
  63  |   for (const color of colors) {
  64  |     test(`verify ${color.name} ( #${color.hex} ) is applied as the background color`, async ({ page }) => {
  65  |       // Click the color name to change the background color
  66  |       await page.click(`text=${color.name}`)
  67  | 
  68  |       // Wait for React to fetch and update DOM
  69  |       await expect(page.locator('text=Current color:')).toContainText(color.hex)
  70  | 
  71  |       // Convert hex to RGB for CSS validation
  72  |       const rgb = convertHexToRGB(`#${color.hex}`)
  73  | 
  74  |       // Verify the header background color matches the expected RGB value
  75  |       await expect(page.locator('header')).toHaveCSS('background-color', `rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})`)
  76  |     })
  77  |   }
  78  | })
  79  | 
  80  | /**
  81  |  * Test: Verify language switcher correctly updates the document's lang attribute
  82  |  */
  83  | test('verify language switcher changes document language', async ({ page }) => {
  84  |   // Select Spanish
  85  |   await page.selectOption('select', 'es')
  86  |   await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  87  | 
  88  |   // Select Greek
  89  |   await page.selectOption('select', 'el')
  90  |   await expect(page.locator('html')).toHaveAttribute('lang', 'el')
  91  | })
  92  | 
  93  | /**
  94  |  * Test Suite: Edge cases and error handling for coverage
  95  |  */
  96  | test.describe('Edge cases and error handling', () => {
  97  |   test('handle initial fetch error', async ({ page }) => {
  98  |     // Mock 500 error for initial colors fetch
  99  |     await page.route('/api/colors', (route) => route.fulfill({ status: 500 }))
  100 |     await page.goto('/')
  101 |     await expect(page.locator('.error-message')).toHaveText('Failed to load colors')
  102 |   })
  103 | 
  104 |   test('handle initial fetch with empty data', async ({ page }) => {
  105 |     // Mock empty array response
  106 |     await page.route('/api/colors', (route) =>
  107 |       route.fulfill({
  108 |         status: 200,
  109 |         contentType: 'application/json',
  110 |         body: JSON.stringify([])
  111 |       })
  112 |     )
  113 |     await page.goto('/')
  114 |     await expect(page.locator('text=Loading colors...')).toBeVisible()
  115 |   })
  116 | 
  117 |   test('handle color selection fetch error', async ({ page }) => {
  118 |     // Mock 500 error for specific color fetch
  119 |     await page.route('/api/colors/Red', (route) => route.fulfill({ status: 500 }))
  120 |     await page.click('text=Red')
  121 |     await expect(page.locator('.error-message')).toHaveText('Failed to load color: Red')
  122 |   })
  123 | 
  124 |   test('handle color response missing hex property', async ({ page }) => {
  125 |     // Mock response missing hex property
  126 |     await page.route('/api/colors/Yellow', (route) =>
  127 |       route.fulfill({
  128 |         status: 200,
  129 |         contentType: 'application/json',
  130 |         body: JSON.stringify({ name: 'Yellow' })
  131 |       })
  132 |     )
> 133 |     await page.click('text=Yellow')
      |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  134 |     // Expect no crash and current color text to remain unchanged (or still be default)
  135 |     await expect(page.locator('text=Current color:')).not.toContainText('undefined')
  136 |   })
  137 | })
  138 | 
```