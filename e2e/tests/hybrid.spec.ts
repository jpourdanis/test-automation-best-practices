import { test, expect } from '../baseFixtures'
import { faker } from '@faker-js/faker'

/**
 * Test Suite: Hybrid E2E Testing
 *
 * This suite demonstrates how to use a hybrid testing approach. Instead of
 * relying entirely on the UI (which is slow and brittle) to set up test state,
 * we use direct backend API calls to quickly inject state, then use the UI
 * for the actual validations. This ensures fast execution and test isolation.
 */
test.describe('Hybrid E2E Testing', () => {
  let createdColorName: string | null = null

  test.afterEach(async ({ request }) => {
    if (createdColorName) {
      await request.delete(`/api/colors/${createdColorName}`)
      createdColorName = null
    }
  })

  test('should create color via API and verify through UI', async ({ homePage, page, request }) => {
    const uniqueName = faker.string.alphanumeric(15)
    const newColor = { name: uniqueName, hex: '#8e44ad' }
    createdColorName = newColor.name

    // 1. Arrange - Use the API to set up the system's state before the test
    const createResponse = await request.post('/api/colors', {
      data: newColor
    })
    expect(createResponse.ok()).toBeTruthy()

    // 2. Act - Navigate to the UI which will now fetch the new state
    await homePage.goto()

    // Since the dynamically-created color name isn't in our english translation
    // file (en.json), i18next falls back to the key "colors.<name>".
    const fallbackKey = `colors.${newColor.name.toLowerCase()}`
    const customBtn = page.getByRole('button', { name: fallbackKey })

    // We use Playwright's waitForResponse to avoid static waits natively,
    // ensuring fast and deterministic execution.
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes(`/api/colors/${newColor.name}`) && resp.status() === 200
    )
    await customBtn.click()
    await responsePromise

    // 3. Assert - Verify the behavior entirely via the UI layer
    await expect(homePage.currentColorText).toContainText(newColor.hex)

    // Check raw CSS to ensure correct visual rendering from DOM level
    await expect(homePage.header).toHaveCSS('background-color', 'rgb(142, 68, 173)')
  })
})
