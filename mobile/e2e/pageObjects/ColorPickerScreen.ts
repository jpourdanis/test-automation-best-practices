import type { ChainablePromiseElement } from 'webdriverio'

/**
 * Returns the correct Appium selector for a React Native `testID` prop.
 *
 * On iOS, React Native maps `testID` → `accessibilityIdentifier`, which
 * Appium exposes via the `~` (accessibility ID) strategy.
 *
 * On Android, React Native maps `testID` → `resource-id`
 * (e.g. `com.example.app:id/my-test-id`), NOT `content-desc`. The `~`
 * strategy targets `content-desc` on Android, so we must use the
 * UiSelector resource-id strategy instead.
 */
function $el(testId: string): ChainablePromiseElement {
  if (driver.isAndroid) {
    // Target the resource-id which is where React Native maps testID on Android.
    // Use a wildcard prefix to handle potential package name prefixes.
    return $(`android=new UiSelector().resourceIdMatches(".*${testId}")`)
  }
  return $(`~${testId}`)
}

class ColorPickerScreen {
  // --- Locators ---
  get title(): ChainablePromiseElement {
    return $el('app-title')
  }

  get currentColor(): ChainablePromiseElement {
    return $el('current-color')
  }

  get addButton(): ChainablePromiseElement {
    return $el('add-color-btn')
  }

  get errorMessage(): ChainablePromiseElement {
    return $el('error-message')
  }

  // Color picker modal
  get colorNameInput(): ChainablePromiseElement {
    return $el('color-name-input')
  }

  get pickerSaveBtn(): ChainablePromiseElement {
    return $el('picker-save-btn')
  }

  get pickerCancelBtn(): ChainablePromiseElement {
    return $el('picker-cancel-btn')
  }

  get pickerError(): ChainablePromiseElement {
    return $el('picker-error')
  }

  get colorPreview(): ChainablePromiseElement {
    return $el('color-preview')
  }

  // Confirm dialog
  get confirmDeleteBtn(): ChainablePromiseElement {
    return $el('confirm-delete-btn')
  }

  get confirmCancelBtn(): ChainablePromiseElement {
    return $el('confirm-cancel-btn')
  }

  langButton(code: string): ChainablePromiseElement {
    return $el(`lang-btn-${code}`)
  }

  colorChip(name: string): ChainablePromiseElement {
    return $el(`chip-select-${name}`)
  }

  deleteChipButton(name: string): ChainablePromiseElement {
    return $el(`chip-delete-${name}`)
  }

  // --- High-Level Actions ---
  async waitForLoad(): Promise<void> {
    await this.title.waitForDisplayed({ timeout: 60000 })
    await this.addButton.waitForDisplayed({ timeout: 60000 })
  }

  async openAddColorModal(): Promise<void> {
    await this.addButton.click()
    await this.colorNameInput.waitForDisplayed({ timeout: 10000 })
  }

  async closeAddColorModal(): Promise<void> {
    await this.pickerCancelBtn.click()
    await this.colorNameInput.waitForDisplayed({ timeout: 10000, reverse: true })
  }

  async submitNewColor(name: string): Promise<void> {
    await this.colorNameInput.setValue(name)
    await this.pickerSaveBtn.click()
  }

  async deleteColor(name: string): Promise<void> {
    await this.deleteChipButton(name).click()
    await this.confirmDeleteBtn.waitForDisplayed({ timeout: 5000 })
    await this.confirmDeleteBtn.click()
    // Wait for the chip to be fully removed from the UI to prevent race conditions
    await this.colorChip(name).waitForDisplayed({ timeout: 15000, reverse: true })
  }
}

export const colorPickerScreen = new ColorPickerScreen()
