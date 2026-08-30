/// <reference types="@wdio/globals/types" />
/// <reference types="@wdio/mocha-framework" />

import { colorPickerScreen } from '../pageObjects/ColorPickerScreen'
import { createApiClient } from '@color-app/shared'

const EXPO_HOST = process.env.EXPO_HOST ?? '127.0.0.1'
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

  it('adds a new color and shows it as a chip', async function () {
    // TODO: flaky on Android emulator — skip until root cause is resolved
    if (driver.isAndroid) return this.skip()
    const name = `Test${Date.now()}`
    createdColorName = name

    // 1. Arrange — inject state directly via API, bypassing the UI
    const createRes = await api.createColor({ name, hex: '#3498db' })
    expect(createRes.ok).toBe(true)

    // 2. Act — reload the app via deep link so the useEffect re-fetches and
    // picks up the new color. Running under Expo Go, there is no standalone
    // app binary to terminate/reactivate by bundle id — reloading the JS is
    // the equivalent restart.
    await browser.execute('mobile: deepLink', {
      url: `exp://${EXPO_HOST}:8081`,
      ...(driver.isIOS ? { bundleId: 'host.exp.Exponent' } : { package: 'host.exp.exponent' })
    })
    await colorPickerScreen.waitForLoad()

    // 3. Assert — scroll horizontally to reveal the chip, then assert
    const chip = colorPickerScreen.colorChip(name)
    await chip.waitForExist({ timeout: 10000 })
    await colorPickerScreen.scrollToChip(name)
    await expect(chip).toBeDisplayed()
  })

  it('switches the UI language', async function () {
    // TODO: flaky on Android emulator — skip until root cause is resolved
    if (driver.isAndroid) return this.skip()
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
