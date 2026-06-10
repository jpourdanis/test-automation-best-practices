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
    await driver.waitUntil(
      async () => {
        try {
          if (driver.isAndroid) {
            // Guard against crashes: new-arch React Native can silently lose
            // foreground during API-triggered re-renders on Android emulators.
            const appState = await driver.queryAppState('com.jpourdanis.colorpicker').catch(() => 0)
            if (appState < 4) {
              await driver.activateApp('com.jpourdanis.colorpicker').catch(() => {})
              return false
            }
            // Step 1 — button on-screen: direct resource-id lookup (fast path).
            const direct = $(`android=new UiSelector().resourceIdMatches(".*add-color-btn")`)
            if (await direct.isExisting()) {
              return await direct.isEnabled()
            }
            // Step 2 — button off-screen: when the chip row loads it pushes the
            // button below the viewport and UiAutomator2 drops it from the tree.
            // Use UiSelector().scrollable(true) without a class filter so that
            // depth-first traversal picks up the outer vertical ReactScrollView
            // before the inner horizontal chip-row ScrollView.
            const scrolled = $(
              `android=new UiScrollable(new UiSelector().scrollable(true)).setMaxSearchSwipes(10).scrollIntoView(new UiSelector().resourceIdMatches(".*add-color-btn"))`
            )
            return await scrolled.isEnabled()
          }
          // iOS: check whether the app is still in the foreground before querying.
          // The app can crash during the initial API response (known native-module
          // interaction on iOS new architecture). When that happens, queryAppState
          // returns < 4 and we relaunch before retrying — this gives the app a
          // second chance to load rather than exhausting the full timeout on a
          // dead session.
          const appState = await driver.queryAppState('com.jpourdanis.colorpicker').catch(() => 0)
          if (appState < 4) {
            await driver.activateApp('com.jpourdanis.colorpicker').catch(() => {})
            return false
          }
          // Use `identifier` (accessibilityIdentifier), not `name` (accessibilityLabel) —
          // React Native's testID prop sets accessibilityIdentifier, not accessibilityLabel.
          // The combined predicate bypasses WDA's per-element state cache which can
          // return stale disabled=true after a React Native re-render.
          return await $('-ios predicate string:identifier == "add-color-btn" AND enabled == 1').isExisting()
        } catch {
          return false
        }
      },
      { timeout: 120000, interval: 500, timeoutMsg: 'Add button did not become enabled within 120s' }
    )

    // On Android, the UiScrollable fallback above may have scrolled the list
    // down to bring the add button into view (when color chips push it off-screen).
    // Scroll back to the top so the title and other elements are visible for tests.
    if (driver.isAndroid) {
      try {
        await $(`android=new UiScrollable(new UiSelector().scrollable(true)).scrollToBeginning(10)`).isExisting()
      } catch {
        // ignore — scroll is best-effort
      }
      // Re-create the element reference on every poll so UiAutomator2 performs a
      // live accessibility-tree query rather than returning its stale cached state
      // from before the scroll.
      await driver.waitUntil(
        async () => {
          try {
            return await $(`android=new UiSelector().resourceIdMatches(".*app-title")`).isDisplayed()
          } catch {
            return false
          }
        },
        { timeout: 15000, interval: 300, timeoutMsg: 'Title not visible after scrolling to top' }
      )
    }
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

  async scrollToChip(name: string): Promise<void> {
    if (driver.isIOS) {
      const chip = this.colorChip(name)
      await driver.execute('mobile: scroll', { element: await chip.elementId, toVisible: true })
    } else {
      // UiScrollable scrolls the parent automatically while locating the element
      await $(
        `android=new UiScrollable(new UiSelector().scrollable(true)).scrollIntoView(new UiSelector().resourceIdMatches(".*chip-select-${name}"))`
      ).waitForExist()
    }
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
