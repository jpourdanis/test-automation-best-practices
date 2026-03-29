import { Page, Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly header: Locator;
  readonly currentColorText: Locator;
  readonly turquoiseBtn: Locator;
  readonly redBtn: Locator;
  readonly yellowBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('header');
    this.currentColorText = page.getByText('Current color:');
    this.turquoiseBtn = page.getByRole('button', { name: 'Turquoise' });
    this.redBtn = page.getByRole('button', { name: 'Red' });
    this.yellowBtn = page.getByRole('button', { name: 'Yellow' });
  }

  async goto() {
    await this.page.goto('/');
  }

  async clickColorButton(colorName: string) {
    await this.page.getByRole('button', { name: colorName }).click();
  }

  async getCurrentColorText(): Promise<string | null> {
    return await this.currentColorText.textContent();
  }
}
