import { test, expect } from "../baseFixtures";
import { HomePage } from "../pages/HomePage";

/**
 * Test Suite: Hybrid E2E Testing
 *
 * This suite demonstrates how to use a hybrid testing approach. Instead of
 * relying entirely on the UI (which is slow and brittle) to set up test state,
 * we use direct backend API calls to quickly inject state, then use the UI
 * for the actual validations. This ensures fast execution and test isolation.
 */
test.describe("Hybrid E2E Testing", () => {
  let homePage: HomePage;

  test("should create color via API and verify through UI", async ({ page, request }) => {
    const newColor = { name: "Purple", hex: "#8e44ad" };
    
    // 1. Arrange - Use the API to set up the system's state before the test
    const createResponse = await request.post("/api/colors", {
      data: newColor,
    });
    expect(createResponse.ok()).toBeTruthy();

    homePage = new HomePage(page);

    // 2. Act - Navigate to the UI which will now fetch the new state
    await homePage.goto();

    // Since "Purple" isn't in our english translation file (en.json), 
    // i18next falls back to the key "colors.purple".
    const customBtn = page.getByRole("button", { name: "colors.purple" });
    
    // We use Playwright's waitForResponse to avoid static waits natively, 
    // ensuring fast and deterministic execution.
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes(`/api/colors/${newColor.name}`) && resp.status() === 200
    );
    await customBtn.click();
    await responsePromise;

    // 3. Assert - Verify the behavior entirely via the UI layer
    await expect(homePage.currentColorText).toContainText(newColor.hex);
    
    // Check raw CSS to ensure correct visual rendering from DOM level
    await expect(homePage.header).toHaveCSS(
      "background-color",
      "rgb(142, 68, 173)"
    );

    // 4. Teardown - Clean the state up via API again, keeping the DB stateless
    const deleteResponse = await request.delete(`/api/colors/${newColor.name}`);
    expect(deleteResponse.ok()).toBeTruthy();
  });
});
