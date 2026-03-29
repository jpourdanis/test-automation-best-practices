import { test, expect } from '../baseFixtures'

// Define the dataset for the data-driven tests
const testData = [
  { name: 'Turquoise', expectedHex: '#1abc9c', expectedRgb: 'rgb(26, 188, 156)' },
  { name: 'Red', expectedHex: '#e74c3c', expectedRgb: 'rgb(231, 76, 60)' },
  { name: 'Yellow', expectedHex: '#f1c40f', expectedRgb: 'rgb(241, 196, 15)' }
]

/**
 * Test Suite: Data-Driven Testing
 *
 * This suite demonstrates how to use a dataset (array of objects) to dynamically
 * generate identical test cases for different inputs, keeping the code DRY.
 */
test.describe('Data-Driven Testing', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto()
  })

  // Loop over the dataset to dynamically generate tests
  for (const data of testData) {
    /**
     * Test: Verify background color reflects dataset value
     *
     * Iterates through the predefined dataset of colors, clicks the corresponding
     * color button, and validates that both the DOM text and CSS background
     * colors match the expected outputs from the dataset.
     */
    test(`changing color to ${data.name} should reflect in UI and DOM`, async ({ homePage }) => {
      // Act
      await homePage.clickColorButton(data.name)

      // Assert Text updates correctly
      await expect(homePage.currentColorText).toContainText(data.expectedHex)

      // Assert DOM styling updates correctly
      // We use page.locator directly here instead of exposing it via POM if we want
      // to check raw CSS properties that don't belong in a simple POM interface.
      await expect(homePage.header).toHaveCSS('background-color', data.expectedRgb)
    })
  }
})
