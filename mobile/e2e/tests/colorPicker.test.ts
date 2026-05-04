/// <reference types="@wdio/globals/types" />
/// <reference types="@wdio/mocha-framework" />

import { colorPickerScreen } from '../pageObjects/ColorPickerScreen'

describe('Color Picker App', () => {
  before(async () => {
    await colorPickerScreen.waitForLoad()
  })

  it('shows the app title', async () => {
    await expect(colorPickerScreen.title).toBeDisplayed()
  })

  it('displays a hex color value', async () => {
    const text = await colorPickerScreen.currentColor.getText()
    expect(text).toMatch(/#[0-9a-f]{6}/i)
  })

  it('opens the color picker modal when Add is tapped', async () => {
    await colorPickerScreen.openAddColorModal()
    await expect(colorPickerScreen.colorPreview).toBeDisplayed()
    await colorPickerScreen.closeAddColorModal()
  })

  it('shows a validation error when saving with an empty name', async () => {
    await colorPickerScreen.openAddColorModal()
    await colorPickerScreen.pickerSaveBtn.click()

    await colorPickerScreen.pickerError.waitForDisplayed({ timeout: 5000 })
    await expect(colorPickerScreen.pickerError).toBeDisplayed()

    await colorPickerScreen.closeAddColorModal()
  })

  it('adds a new color and shows it as a chip', async () => {
    const name = `Test${Date.now()}`
    await colorPickerScreen.openAddColorModal()
    await colorPickerScreen.submitNewColor(name)

    // Modal closes only after both API calls (POST + GET) complete — wait for it
    // to disappear before looking for the chip, avoiding a race condition.
    await colorPickerScreen.colorNameInput.waitForDisplayed({ timeout: 30000, reverse: true })

    const chip = colorPickerScreen.colorChip(name)
    await chip.waitForExist({ timeout: 10000 })
    await expect(chip).toBeDisplayed()

    // cleanup — delete the color we just added
    await colorPickerScreen.deleteColor(name)
  })

  it('switches the UI language', async () => {
    const esButton = colorPickerScreen.langButton('es')
    await esButton.click()

    // Explicit wait for the state change instead of arbitrary pause
    await driver.waitUntil(
      async () => {
        const attr = driver.isAndroid ? 'selected' : 'value'
        const selected = await esButton.getAttribute(attr)
        return selected === '1' || selected === 'true'
      },
      {
        timeout: 5000,
        timeoutMsg: 'Expected ES language button to be selected'
      }
    )

    // Cross-platform check for selected state
    const attr = driver.isAndroid ? 'selected' : 'value'
    const selected = await esButton.getAttribute(attr)
    expect(selected ?? '').toMatch(/^(1|true)$/)

    const enButton = colorPickerScreen.langButton('en')
    await enButton.click()
  })
})
