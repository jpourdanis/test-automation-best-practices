import type { ChainablePromiseElement } from 'webdriverio'

class ColorPickerScreen {
  get title(): ChainablePromiseElement {
    return $('~app-title')
  }

  get currentColor(): ChainablePromiseElement {
    return $('~current-color')
  }

  get addButton(): ChainablePromiseElement {
    return $('~add-color-btn')
  }

  get errorMessage(): ChainablePromiseElement {
    return $('~error-message')
  }

  // Color picker modal
  get colorNameInput(): ChainablePromiseElement {
    return $('~color-name-input')
  }

  get pickerSaveBtn(): ChainablePromiseElement {
    return $('~picker-save-btn')
  }

  get pickerCancelBtn(): ChainablePromiseElement {
    return $('~picker-cancel-btn')
  }

  get pickerError(): ChainablePromiseElement {
    return $('~picker-error')
  }

  get colorPreview(): ChainablePromiseElement {
    return $('~color-preview')
  }

  // Confirm dialog
  get confirmDeleteBtn(): ChainablePromiseElement {
    return $('~confirm-delete-btn')
  }

  get confirmCancelBtn(): ChainablePromiseElement {
    return $('~confirm-cancel-btn')
  }

  langButton(code: string): ChainablePromiseElement {
    return $(`~lang-btn-${code}`)
  }

  colorChip(name: string): ChainablePromiseElement {
    return $(`~chip-select-${name}`)
  }

  deleteChipButton(name: string): ChainablePromiseElement {
    return $(`~chip-delete-${name}`)
  }

  async waitForLoad(): Promise<void> {
    await this.title.waitForDisplayed({ timeout: 20000 })
    await this.addButton.waitForDisplayed({ timeout: 20000 })
  }
}

export const colorPickerScreen = new ColorPickerScreen()
