import { Page, Locator } from '@playwright/test'

export class HomePage {
  readonly page: Page
  readonly header: Locator
  readonly currentColorText: Locator
  readonly turquoiseBtn: Locator
  readonly redBtn: Locator
  readonly yellowBtn: Locator
  readonly addColorBtn: Locator
  readonly pickerCard: Locator
  readonly pickerNameInput: Locator
  readonly pickerSubmitBtn: Locator
  readonly pickerCancelBtn: Locator
  readonly confirmCard: Locator
  readonly confirmDeleteBtn: Locator
  readonly confirmCancelBtn: Locator

  constructor(page: Page) {
    this.page = page
    this.header = page.locator('header')
    this.currentColorText = page.getByText('Current color:')
    // Exact aria-label prevents matching the chip-x "Remove color: X" buttons
    this.turquoiseBtn = page.getByRole('button', { name: 'Change background to Turquoise', exact: true })
    this.redBtn = page.getByRole('button', { name: 'Change background to Red', exact: true })
    this.yellowBtn = page.getByRole('button', { name: 'Change background to Yellow', exact: true })
    this.addColorBtn = page.getByRole('button', { name: '+ Add color', exact: true })
    this.pickerCard = page.locator('.picker-card')
    this.pickerNameInput = page.getByPlaceholder('e.g. Ocean')
    this.pickerSubmitBtn = page.getByRole('button', { name: 'Add color', exact: true })
    this.pickerCancelBtn = page.locator('.picker-card').getByRole('button', { name: 'Cancel', exact: true })
    this.confirmCard = page.locator('.confirm-card')
    this.confirmDeleteBtn = page.getByRole('button', { name: 'Delete', exact: true })
    this.confirmCancelBtn = page.locator('.confirm-card').getByRole('button', { name: 'Cancel', exact: true })
  }

  async goto() {
    await this.page.goto('/')
  }

  async clickColorButton(colorName: string) {
    await this.page.locator('button.chip-main', { hasText: colorName }).click()
  }

  async clickDeleteChip(colorName: string) {
    await this.page.getByRole('button', { name: `Remove color: ${colorName}`, exact: true }).click()
  }

  async getCurrentColorText(): Promise<string | null> {
    return await this.currentColorText.textContent()
  }

  async openColorPicker() {
    await this.addColorBtn.click()
  }

  async deleteColor(colorName: string) {
    await this.clickDeleteChip(colorName)
    await this.confirmDeleteBtn.click()
  }
}
