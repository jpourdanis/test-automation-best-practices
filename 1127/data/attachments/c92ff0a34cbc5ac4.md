# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/pom-refactored.spec.ts >> POM Refactored: Background color tests >> verify Yellow ( #f1c40f ) is applied as the background color
- Location: e2e/tests/pom-refactored.spec.ts:29:9

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button.chip-main').filter({ hasText: 'Yellow' })

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
    - link "Learn React" [ref=e12] [cursor=pointer]:
      - /url: https://reactjs.org
    - generic [ref=e13]: "Current color: #1abc9c"
    - generic [ref=e14]:
      - paragraph [ref=e15]: Loading colors...
      - button "+ Add color" [ref=e16] [cursor=pointer]
```

# Test source

```ts
  1  | import { Page, Locator } from '@playwright/test'
  2  | 
  3  | export class HomePage {
  4  |   readonly page: Page
  5  |   readonly header: Locator
  6  |   readonly currentColorText: Locator
  7  |   readonly turquoiseBtn: Locator
  8  |   readonly redBtn: Locator
  9  |   readonly yellowBtn: Locator
  10 |   readonly addColorBtn: Locator
  11 |   readonly pickerCard: Locator
  12 |   readonly pickerNameInput: Locator
  13 |   readonly pickerSubmitBtn: Locator
  14 |   readonly pickerCancelBtn: Locator
  15 |   readonly confirmCard: Locator
  16 |   readonly confirmDeleteBtn: Locator
  17 |   readonly confirmCancelBtn: Locator
  18 | 
  19 |   constructor(page: Page) {
  20 |     this.page = page
  21 |     this.header = page.locator('header')
  22 |     this.currentColorText = page.getByText('Current color:')
  23 |     // Exact aria-label prevents matching the chip-x "Remove color: X" buttons
  24 |     this.turquoiseBtn = page.getByRole('button', { name: 'Change background to Turquoise', exact: true })
  25 |     this.redBtn = page.getByRole('button', { name: 'Change background to Red', exact: true })
  26 |     this.yellowBtn = page.getByRole('button', { name: 'Change background to Yellow', exact: true })
  27 |     this.addColorBtn = page.getByRole('button', { name: '+ Add color', exact: true })
  28 |     this.pickerCard = page.locator('.picker-card')
  29 |     this.pickerNameInput = page.getByPlaceholder('e.g. Ocean')
  30 |     this.pickerSubmitBtn = page.getByRole('button', { name: 'Add color', exact: true })
  31 |     this.pickerCancelBtn = page.locator('.picker-card').getByRole('button', { name: 'Cancel', exact: true })
  32 |     this.confirmCard = page.locator('.confirm-card')
  33 |     this.confirmDeleteBtn = page.getByRole('button', { name: 'Delete', exact: true })
  34 |     this.confirmCancelBtn = page.locator('.confirm-card').getByRole('button', { name: 'Cancel', exact: true })
  35 |   }
  36 | 
  37 |   async goto() {
  38 |     await this.page.goto('/')
  39 |   }
  40 | 
  41 |   async clickColorButton(colorName: string) {
> 42 |     await this.page.locator('button.chip-main', { hasText: colorName }).click()
     |                                                                         ^ Error: locator.click: Test timeout of 30000ms exceeded.
  43 |   }
  44 | 
  45 |   async clickDeleteChip(colorName: string) {
  46 |     await this.page.getByRole('button', { name: `Remove color: ${colorName}`, exact: true }).click()
  47 |   }
  48 | 
  49 |   async getCurrentColorText(): Promise<string | null> {
  50 |     return await this.currentColorText.textContent()
  51 |   }
  52 | 
  53 |   async openColorPicker() {
  54 |     await this.addColorBtn.click()
  55 |   }
  56 | 
  57 |   async deleteColor(colorName: string) {
  58 |     await this.clickDeleteChip(colorName)
  59 |     await this.confirmDeleteBtn.click()
  60 |   }
  61 | }
  62 | 
```