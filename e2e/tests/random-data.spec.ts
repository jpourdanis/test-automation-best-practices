import { test, expect } from "../baseFixtures";
import { faker } from "@faker-js/faker";

/**
 * Test Suite: Random Data Generation Testing
 *
 * This suite builds upon Hybrid E2E Testing by injecting dynamic, randomized
 * test data using faker.js. Instead of hardcoding "Purple", we dynamically 
 * generate a color and assert that the system correctly renders whatever data
 * the API provides.
 *
 * Random data testing is crucial to ensure tests don't become coupled to
 * specific static data shapes, and to discover edge-cases naturally over time.
 */
test.describe("Random Data Testing with faker.js", () => {
  let createdColorName: string | null = null;

  test.afterEach(async ({ request }) => {
    if (createdColorName) {
      await request.delete(`/api/colors/${createdColorName}`);
      createdColorName = null;
    }
  });

  test("should create dynamic random color via API and verify through UI", async ({ homePage, page, request }) => {
    // Generate a uniquely prefixed name to avoid any potential DB collisions
    // e2e_random_<word>
    const randomColorName = faker.string.alphanumeric(15);
    const randomHex = faker.color.rgb();
    
    const newColor = { name: randomColorName, hex: randomHex };
    createdColorName = newColor.name;
    
    // 1. Arrange - Use the API to set up the system's state before the test
    const createResponse = await request.post("/api/colors", {
      data: newColor,
    });
    expect(createResponse.ok()).toBeTruthy();


    // 2. Act - Navigate to the UI which will now fetch the new state
    await homePage.goto();

    // Since this random string isn't in our english translation file (en.json), 
    // i18next falls back to the key "colors.<randomColorName>".
    // We use .toLowerCase() to match the App.tsx implementation: {t(`colors.${c.name.toLowerCase()}`)}
    const customBtn = page.getByRole("button", { name: `colors.${newColor.name.toLowerCase()}` });
    
    // We use Playwright's waitForResponse to avoid static waits natively, 
    // ensuring fast and deterministic execution.
    // We use encodeURIComponent to handle potential spaces or special characters in the name.
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes(`/api/colors/${encodeURIComponent(newColor.name)}`) && resp.status() === 200
    );
    await customBtn.click();
    await responsePromise;

    // 3. Assert - Verify the behavior entirely via the UI layer
    await expect(homePage.currentColorText).toContainText(newColor.hex);
  });
});
