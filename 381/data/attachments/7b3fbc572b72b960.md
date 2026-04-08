# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/visual.spec.ts >> Responsive Design Testing >> should render correctly on mobile viewport
- Location: e2e/tests/visual.spec.ts:67:7

# Error details

```
Error: page.goto: net::ERR_SSL_PROTOCOL_ERROR at http://app:3000/
Call log:
  - navigating to "http://app:3000/", waiting until "load"

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
  10 | 
  11 |   constructor(page: Page) {
  12 |     this.page = page
  13 |     this.header = page.locator('header')
  14 |     this.currentColorText = page.getByText('Current color:')
  15 |     this.turquoiseBtn = page.getByRole('button', { name: 'Turquoise' })
  16 |     this.redBtn = page.getByRole('button', { name: 'Red' })
  17 |     this.yellowBtn = page.getByRole('button', { name: 'Yellow' })
  18 |   }
  19 | 
  20 |   async goto() {
> 21 |     await this.page.goto('/')
     |                     ^ Error: page.goto: net::ERR_SSL_PROTOCOL_ERROR at http://app:3000/
  22 |   }
  23 | 
  24 |   async clickColorButton(colorName: string) {
  25 |     await this.page.getByRole('button', { name: colorName }).click()
  26 |   }
  27 | 
  28 |   async getCurrentColorText(): Promise<string | null> {
  29 |     return await this.currentColorText.textContent()
  30 |   }
  31 | }
  32 | 
```