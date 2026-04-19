# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ../.features-gen/e2e/features/i18n.feature.spec.js >> Language Switching >> Color button remains functional after switching language
- Location: .features-gen/e2e/features/i18n.feature.spec.js:38:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Change background to Turquesa', exact: true })

```

# Page snapshot

```yaml
- main [ref=e4]:
  - generic [ref=e5]:
    - combobox "Seleccionar Idioma" [ref=e7] [cursor=pointer]:
      - option "English"
      - option "Español" [selected]
      - option "Ελληνικά"
    - img "logo"
    - heading "Aplicación de elección de color" [level=1] [ref=e8]
    - paragraph [ref=e9]:
      - text: Edita
      - code [ref=e10]: src/App.js
      - text: y guarda para recargar.
    - link "Aprender React" [ref=e11] [cursor=pointer]:
      - /url: https://reactjs.org
    - generic [ref=e12]: "Color actual: #1abc9c"
    - generic [ref=e13]:
      - generic [ref=e14]:
        - button "Cambiar el fondo a Turquesa" [pressed] [ref=e15] [cursor=pointer]: Turquesa
        - 'button "Eliminar color: Turquesa" [ref=e17] [cursor=pointer]': ×
      - generic [ref=e18]:
        - button "Cambiar el fondo a Rojo" [ref=e19] [cursor=pointer]: Rojo
        - 'button "Eliminar color: Rojo" [ref=e21] [cursor=pointer]': ×
      - generic [ref=e22]:
        - button "Cambiar el fondo a Amarillo" [ref=e23] [cursor=pointer]: Amarillo
        - 'button "Eliminar color: Amarillo" [ref=e25] [cursor=pointer]': ×
      - button "+ Añadir color" [ref=e26] [cursor=pointer]
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
> 42 |     await this.page.getByRole('button', { name: `Change background to ${colorName}`, exact: true }).click()
     |                                                                                                     ^ Error: locator.click: Test timeout of 30000ms exceeded.
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