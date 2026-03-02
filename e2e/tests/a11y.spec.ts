import { test, expect } from "../baseFixtures";
import { HomePage } from "../pages/HomePage";
import AxeBuilder from "@axe-core/playwright";

/**
 * Test Suite: Accessibility Tests
 * 
 * This suite demonstrates how to use @axe-core/playwright to run accessibility 
 * audits against the DOM. It ensures that the application complies with 
 * accessibility WCAG guidelines.
 */
test.describe("Accessibility Tests", () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  /**
   * Test: Automatically detectable accessibility issues
   * 
   * Scans the initial page state for any accessibility violations, ensuring
   * that elements like headings, ARIA tags, and contrast are compliant.
   */
  test("should not have any automatically detectable accessibility issues", async ({
    page,
  }) => {
    // Wait for the main elements to render
    await expect(homePage.header).toBeVisible();

    // Run Axe to check for accessibility violations
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    // Verify there are no violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  /**
   * Test: Accessibility after state change
   * 
   * Verifies that the application remains accessible after user interactions,
   * specifically ensuring that color contrast ratios remain valid when the 
   * background color changes dynamically.
   */
  test("should maintain accessibility after state change (color update)", async ({
    page,
  }) => {
    // Change color to verify contrast and other rules still pass
    await homePage.clickColorButton("Yellow");
    
    // Wait for the color change to apply (indicated by the text changing)
    await expect(homePage.currentColorText).toContainText("#f1c40f");

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    // We specifically check contrast rules after a background color change
    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === "color-contrast"
    );
    expect(contrastViolations).toEqual([]);
  });
});

import enTranslations from "../../src/locales/en.json";
import esTranslations from "../../src/locales/es.json";
import elTranslations from "../../src/locales/el.json";

/**
 * Test Suite: i18n Accessibility Tests
 * 
 * Demonstrates best practices for handling multiple languages without 
 * relying on brittle DOM manipulation locators. By importing the language 
 * JSON directly, we can use resilient user-centric locators.
 */
test.describe("i18n Accessibility Tests", () => {
  const languages = [
    { code: "en", i18n: enTranslations },
    { code: "es", i18n: esTranslations },
    { code: "el", i18n: elTranslations },
  ];

  for (const lang of languages) {
    test(`should maintain accessibility in ${lang.code} language and verify resilient locators`, async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      // Change the language. Default is English, so the label starts as English.
      const languageDropdown = page.getByRole("combobox", { name: enTranslations.languageSelector });
      await languageDropdown.selectOption(lang.code);

      // Verify page layout using dynamic, translation-aware accessibility locators!
      // This is the clean, resilient way over falling back to CSS selectors.
      await expect(page.getByRole("heading", { name: lang.i18n.title })).toBeVisible();
      await expect(page.getByRole("button", { name: lang.i18n.colors.turquoise })).toBeVisible();
      await expect(page.getByRole("button", { name: lang.i18n.colors.red })).toBeVisible();
      await expect(page.getByRole("button", { name: lang.i18n.colors.yellow })).toBeVisible();

      // Run Axe to check for accessibility violations in the translated state
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  }
});
