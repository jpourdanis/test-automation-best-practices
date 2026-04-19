# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ../.features-gen/e2e/features/i18n.feature.spec.js >> Language Switching >> Switch language and verify translated UI labels >> Example #2
- Location: .features-gen/e2e/features/i18n.feature.spec.js:20:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Τιρκουάζ' })
Expected: visible
Error: strict mode violation: getByRole('button', { name: 'Τιρκουάζ' }) resolved to 2 elements:
    1) <button title="#1abc9c" class="chip-main" aria-pressed="true" aria-label="Αλλαγή φόντου σε Τιρκουάζ">…</button> aka getByRole('button', { name: 'Αλλαγή φόντου σε Τιρκουάζ' })
    2) <button class="chip-x" title="Διαγραφή χρώματος: Τιρκουάζ" aria-label="Διαγραφή χρώματος: Τιρκουάζ">×</button> aka getByRole('button', { name: 'Διαγραφή χρώματος: Τιρκουάζ' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: 'Τιρκουάζ' })

```

# Page snapshot

```yaml
- main [ref=e4]:
  - generic [ref=e5]:
    - combobox "Επιλογή Γλώσσας" [ref=e7] [cursor=pointer]:
      - option "English"
      - option "Español"
      - option "Ελληνικά" [selected]
    - img "logo"
    - heading "Εφαρμογή επιλογής χρώματος" [level=1] [ref=e8]
    - paragraph [ref=e9]:
      - text: Επεξεργαστείτε το
      - code [ref=e10]: src/App.js
      - text: και αποθηκεύστε για επαναφόρτωση.
    - link "Μάθετε React" [ref=e11] [cursor=pointer]:
      - /url: https://reactjs.org
    - generic [ref=e12]: "Τρέχον χρώμα: #1abc9c"
    - generic [ref=e13]:
      - generic [ref=e14]:
        - button "Αλλαγή φόντου σε Τιρκουάζ" [pressed] [ref=e15] [cursor=pointer]: Τιρκουάζ
        - 'button "Διαγραφή χρώματος: Τιρκουάζ" [ref=e17] [cursor=pointer]': ×
      - generic [ref=e18]:
        - button "Αλλαγή φόντου σε Κόκκινο" [ref=e19] [cursor=pointer]: Κόκκινο
        - 'button "Διαγραφή χρώματος: Κόκκινο" [ref=e21] [cursor=pointer]': ×
      - generic [ref=e22]:
        - button "Αλλαγή φόντου σε Κίτρινο" [ref=e23] [cursor=pointer]: Κίτρινο
        - 'button "Διαγραφή χρώματος: Κίτρινο" [ref=e25] [cursor=pointer]': ×
      - button "+ Προσθήκη χρώματος" [ref=e26] [cursor=pointer]
```

# Test source

```ts
  20  | /**
  21  |  * Given Step: Navigation
  22  |  * Ensures the user is on the home page before proceeding with the scenario.
  23  |  */
  24  | Given('I am on the home page', async ({ page }) => {
  25  |   homePage = new HomePage(page)
  26  |   await homePage.goto()
  27  | })
  28  | 
  29  | /**
  30  |  * When Step: Interaction
  31  |  * Simulates a user clicking a color button.
  32  |  */
  33  | When('I click the {string} color button', async ({}, color: string) => {
  34  |   await homePage.clickColorButton(color)
  35  | })
  36  | 
  37  | /**
  38  |  * Then Step: UI Verification (Text)
  39  |  * Asserts that the current color text displayed matches the expected hex code.
  40  |  */
  41  | Then('the active color text should be {string}', async ({}, hex: string) => {
  42  |   await expect(homePage.currentColorText).toContainText(hex)
  43  | })
  44  | 
  45  | /**
  46  |  * Then Step: UI Verification (Style)
  47  |  * Asserts that the background color of the header actually changes in the DOM.
  48  |  */
  49  | Then('the background color should be {string}', async ({}, rgb: string) => {
  50  |   await expect(homePage.header).toHaveCSS('background-color', rgb)
  51  | })
  52  | 
  53  | // ---------------------------------------------------------------------------
  54  | // API Error Handling steps (error-handling.feature)
  55  | // ---------------------------------------------------------------------------
  56  | 
  57  | /**
  58  |  * Given Step: Route mock — 500 on GET /api/colors
  59  |  * Must be registered before navigation so the mock is active when the page loads.
  60  |  */
  61  | Given('the API returns a server error for the colors list', async ({ page }) => {
  62  |   await page.route('**/api/colors', (route) => route.fulfill({ status: 500 }))
  63  | })
  64  | 
  65  | /**
  66  |  * Given Step: Route mock — empty array on GET /api/colors
  67  |  */
  68  | Given('the API returns an empty colors list', async ({ page }) => {
  69  |   await page.route('**/api/colors', (route) =>
  70  |     route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  71  |   )
  72  | })
  73  | 
  74  | /**
  75  |  * Given Step: Route mock — 500 on GET /api/colors/:name
  76  |  * Registered after navigation so only the specific button click is affected.
  77  |  */
  78  | Given('the API returns a server error for the {string} color', async ({ page }, color: string) => {
  79  |   await page.route(`**/api/colors/${color}`, (route) => route.fulfill({ status: 500 }))
  80  | })
  81  | 
  82  | /**
  83  |  * Then Step: Assert that the .error-message element contains the expected text.
  84  |  */
  85  | Then('I should see the error message {string}', async ({}, message: string) => {
  86  |   await expect(homePage.page.locator('.error-message')).toHaveText(message)
  87  | })
  88  | 
  89  | /**
  90  |  * Then Step: Assert that any visible text on the page matches the expected string.
  91  |  */
  92  | Then('I should see the text {string}', async ({}, text: string) => {
  93  |   await expect(homePage.page.getByText(text)).toBeVisible()
  94  | })
  95  | 
  96  | // ---------------------------------------------------------------------------
  97  | // Internationalisation steps (i18n.feature)
  98  | // ---------------------------------------------------------------------------
  99  | 
  100 | /**
  101 |  * When Step: Select a language from the language-selector dropdown.
  102 |  */
  103 | When('I select the language {string}', async ({}, code: string) => {
  104 |   await homePage.page.selectOption('select', code)
  105 | })
  106 | 
  107 | /**
  108 |  * Then Step: Assert the page <h1> heading matches the translated title.
  109 |  */
  110 | Then('the page title should be {string}', async ({}, title: string) => {
  111 |   await expect(homePage.page.getByRole('heading', { name: title })).toBeVisible()
  112 | })
  113 | 
  114 | /**
  115 |  * Then Step: Assert that a color button displays the expected translated label.
  116 |  * The first argument is the logical color name (used only for readable Gherkin);
  117 |  * the second argument is the translated label to look up in the DOM.
  118 |  */
  119 | Then('the {string} button label should be {string}', async ({}, _color: string, label: string) => {
> 120 |   await expect(homePage.page.getByRole('button', { name: label })).toBeVisible()
      |                                                                    ^ Error: expect(locator).toBeVisible() failed
  121 | })
  122 | 
```