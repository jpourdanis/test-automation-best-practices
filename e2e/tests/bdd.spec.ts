/* no test cases */
import { createBdd } from 'playwright-bdd'
import { expect } from '@playwright/test'
import { HomePage } from '../pages/HomePage'

/**
 * BDD Step Definitions
 *
 * This file contains the Given, When, Then step definitions for Cucumber/Gherkin
 * style testing. It uses `playwright-bdd` to map feature file steps to
 * Playwright actions.
 *
 * Step definitions are designed to be reusable across different feature files
 * and abstract the underlying Page Object Model (POM) interactions.
 */
const { Given, When, Then } = createBdd()

let homePage: HomePage

/**
 * Given Step: Navigation
 * Ensures the user is on the home page before proceeding with the scenario.
 */
Given('I am on the home page', async ({ page }) => {
  homePage = new HomePage(page)
  await homePage.goto()
})

/**
 * When Step: Interaction
 * Simulates a user clicking a color button.
 */
When('I click the {string} color button', async ({}, color: string) => {
  await homePage.clickColorButton(color)
})

/**
 * Then Step: UI Verification (Text)
 * Asserts that the current color text displayed matches the expected hex code.
 */
Then('the active color text should be {string}', async ({}, hex: string) => {
  await expect(homePage.currentColorText).toContainText(hex)
})

/**
 * Then Step: UI Verification (Style)
 * Asserts that the background color of the header actually changes in the DOM.
 */
Then('the background color should be {string}', async ({}, rgb: string) => {
  await expect(homePage.header).toHaveCSS('background-color', rgb)
})

// ---------------------------------------------------------------------------
// API Error Handling steps (error-handling.feature)
// ---------------------------------------------------------------------------

/**
 * Given Step: Route mock — 500 on GET /api/colors
 * Must be registered before navigation so the mock is active when the page loads.
 */
Given('the API returns a server error for the colors list', async ({ page }) => {
  await page.route('**/api/colors', (route) => route.fulfill({ status: 500 }))
})

/**
 * Given Step: Route mock — empty array on GET /api/colors
 */
Given('the API returns an empty colors list', async ({ page }) => {
  await page.route('**/api/colors', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  )
})

/**
 * Given Step: Route mock — 500 on GET /api/colors/:name
 * Registered after navigation so only the specific button click is affected.
 */
Given('the API returns a server error for the {string} color', async ({ page }, color: string) => {
  await page.route(`**/api/colors/${color}`, (route) => route.fulfill({ status: 500 }))
})

/**
 * Then Step: Assert that the .error-message element contains the expected text.
 */
Then('I should see the error message {string}', async ({}, message: string) => {
  await expect(homePage.page.locator('.error-message')).toHaveText(message)
})

/**
 * Then Step: Assert that any visible text on the page matches the expected string.
 */
Then('I should see the text {string}', async ({}, text: string) => {
  await expect(homePage.page.getByText(text)).toBeVisible()
})

// ---------------------------------------------------------------------------
// Internationalisation steps (i18n.feature)
// ---------------------------------------------------------------------------

/**
 * When Step: Select a language from the language-selector dropdown.
 */
When('I select the language {string}', async ({}, code: string) => {
  await homePage.page.selectOption('select', code)
})

/**
 * Then Step: Assert the page <h1> heading matches the translated title.
 */
Then('the page title should be {string}', async ({}, title: string) => {
  await expect(homePage.page.getByRole('heading', { name: title })).toBeVisible()
})

/**
 * Then Step: Assert that a color button displays the expected translated label.
 * The first argument is the logical color name (used only for readable Gherkin);
 * the second argument is the translated label to look up in the DOM.
 */
Then('the {string} button label should be {string}', async ({}, _color: string, label: string) => {
  await expect(homePage.page.locator('button.chip-main', { hasText: label })).toBeVisible()
})
