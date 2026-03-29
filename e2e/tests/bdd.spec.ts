import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

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
const { Given, When, Then } = createBdd();

let homePage: HomePage;

/**
 * Given Step: Navigation
 * Ensures the user is on the home page before proceeding with the scenario.
 */
Given('I am on the home page', async ({ page }) => {
  homePage = new HomePage(page);
  await homePage.goto();
});

/**
 * When Step: Interaction
 * Simulates a user clicking a color button.
 */
When('I click the {string} color button', async ({}, color: string) => {
  await homePage.clickColorButton(color);
});

/**
 * Then Step: UI Verification (Text)
 * Asserts that the current color text displayed matches the expected hex code.
 */
Then('the active color text should be {string}', async ({}, hex: string) => {
  await expect(homePage.currentColorText).toContainText(hex);
});

/**
 * Then Step: UI Verification (Style)
 * Asserts that the background color of the header actually changes in the DOM.
 */
Then('the background color should be {string}', async ({}, rgb: string) => {
  await expect(homePage.header).toHaveCSS('background-color', rgb);
});
