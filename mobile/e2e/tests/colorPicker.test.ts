/// <reference types="@wdio/globals/types" />
/// <reference types="@wdio/mocha-framework" />

import { colorPickerScreen } from '../pageObjects/ColorPickerScreen'
import { createApiClient } from '@color-app/shared'

const BUNDLE_ID = 'com.jpourdanis.colorpicker'
const api = createApiClient({ baseUrl: 'https://test-automation-best-practices.vercel.app' })

describe('Color Picker App', () => {
  let createdColorName: string | null = null

  before(async () => {
    await colorPickerScreen.waitForLoad()
  })

  afterEach(async () => {
    if (createdColorName) {
      await api.deleteColor(createdColorName).catch(() => {})
      createdColorName = null
    }
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
    createdColorName = name

    // 1. Arrange — inject state directly via API, bypassing the UI
    const createRes = await api.createColor({ name, hex: '#3498db' })
    expect(createRes.ok).toBe(true)

    // 2. Act — restart the app so the useEffect re-fetches and picks up the new color
    await driver.terminateApp(BUNDLE_ID)
    await driver.activateApp(BUNDLE_ID)
    await colorPickerScreen.waitForLoad()

    // 3. Assert — the chip must be visible
    const chip = colorPickerScreen.colorChip(name)
    await chip.waitForExist({ timeout: 10000 })
    await expect(chip).toBeDisplayed()
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
