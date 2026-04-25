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
    await colorPickerScreen.addButton.click()
    await colorPickerScreen.colorNameInput.waitForDisplayed({ timeout: 10000 })
    await expect(colorPickerScreen.colorPreview).toBeDisplayed()
    await colorPickerScreen.pickerCancelBtn.click()
  })

  it('shows a validation error when saving with an empty name', async () => {
    await colorPickerScreen.addButton.click()
    await colorPickerScreen.colorNameInput.waitForDisplayed({ timeout: 10000 })
    await colorPickerScreen.pickerSaveBtn.click()
    await colorPickerScreen.pickerError.waitForDisplayed({ timeout: 5000 })
    await expect(colorPickerScreen.pickerError).toBeDisplayed()
    await colorPickerScreen.pickerCancelBtn.click()
  })

  it('adds a new color and shows it as a chip', async () => {
    const name = `Test${Date.now()}`
    await colorPickerScreen.addButton.click()
    await colorPickerScreen.colorNameInput.waitForDisplayed({ timeout: 10000 })
    await colorPickerScreen.colorNameInput.setValue(name)
    await colorPickerScreen.pickerSaveBtn.click()
    // Modal closes only after both API calls (POST + GET) complete — wait for it
    // to disappear before looking for the chip, avoiding a race condition.
    await colorPickerScreen.colorNameInput.waitForDisplayed({ timeout: 30000, reverse: true })
    const chip = colorPickerScreen.colorChip(name)
    await chip.waitForExist({ timeout: 10000 })
    await chip.scrollIntoView({ direction: 'left' })
    await expect(chip).toBeDisplayed()

    // cleanup — delete the color we just added
    await colorPickerScreen.deleteChipButton(name).click()
    await colorPickerScreen.confirmDeleteBtn.waitForDisplayed({ timeout: 5000 })
    await colorPickerScreen.confirmDeleteBtn.click()
  })

  it('switches the UI language', async () => {
    await colorPickerScreen.langButton('es').click()
    await driver.pause(800)
    const selected = await colorPickerScreen.langButton('es').getAttribute('value')
    expect(selected).toBe('1') // XCUITest reports selected state as "1"
    await colorPickerScreen.langButton('en').click()
  })
})
