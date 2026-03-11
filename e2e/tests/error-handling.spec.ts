import { test, expect } from "../baseFixtures";

test.describe("UI Error Handling Coverage", () => {
  test("should handle fetch colors network failure gracefully", async ({ homePage, page }) => {
    // Abort the initial colors fetch
    await page.route("**/api/colors", (route) => route.abort('failed'));
    await homePage.goto();
    
    // The UI should show "Loading colors..." because colors array is empty
    await expect(page.locator("text=Loading colors...")).toBeVisible();
  });

  test("should handle color click network failure gracefully", async ({ homePage, page }) => {
    // Start normally
    await homePage.goto();

    // Abort the specific color fetch
    await page.route("**/api/colors/Turquoise", (route) => route.abort('failed'));

    // Capture console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    // We must wait for the buttons to appear using accessible locators in the real app,
    // Note that the translation key in the actual test is accessible.
    // The locator text=colors.turquoise (from translation config) or English "Turquoise"
    // Since UI loads default english or i18n, let's look for "Turquoise"
    await page.locator("text=Turquoise").click();

    // Wait a bit for the async catch block to execute
    await page.waitForTimeout(500);

    // Assert that the error line in App.tsx was executed and caught
    expect(errors.some(e => e.includes("Failed to fetch hex for Turquoise"))).toBeTruthy();
  });

  test("should show loading state when API returns empty colors", async ({ homePage, page }) => {
    // Mock the API to return an empty array to cover the `data.length > 0` false branch
    await page.route("**/api/colors", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" })
    );
    await homePage.goto();

    // The UI should show "Loading colors..." because the condition `data.length > 0` is false
    await expect(page.locator("text=Loading colors...")).toBeVisible();
  });
});
