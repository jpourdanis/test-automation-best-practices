import * as fs from "fs";
import * as path from "path";
import { test as baseTest } from "@playwright/test";
import { generateUUID } from "./helper";
import { HomePage } from "./pages/HomePage";
import * as allure from "allure-js-commons";

/**
 * Directory where Istanbul will store coverage data
 * Uses the current working directory to create a .nyc_output folder
 */
const istanbulCLIOutput = path.join(process.cwd(), ".nyc_output");

// istanbulCLIOutput is now cleaned up in global-setup.ts

/**
 * Extended Playwright test fixture that adds code coverage collection
 * This adds Istanbul coverage support to all tests using this fixture
 */
export const test = baseTest.extend<{ homePage: HomePage ;allureBddMapper: void}>({
  // Automatically instantiate Page Objects
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
    
  },

  // Decorate the default page fixture to include comprehensive logging
  page: async ({ page }, use, testInfo) => {
    // 1. Log console messages
    page.on("console", (msg) => {
      const type = msg.type();
      // Emphasize errors, but you can also log info/warnings by removing the condition
      if (type === "error" || type === "warning") {
        console.error(`[CONSOLE ${type.toUpperCase()}] ${testInfo.title}: ${msg.text()}`);
      }
    });

    // 2. Log failed network requests (e.g. DNS issues, aborted requests)
    page.on("requestfailed", (request) => {
      console.error(`[NETWORK ERROR] ${testInfo.title}: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });

    // 3. Log API Responses (Errors and Successes)
    page.on("response", (response) => {
      // Filter the resource type so we only log API data, avoiding noise from images/css/fonts
      const resourceType = response.request().resourceType();
      if (resourceType === "fetch" || resourceType === "xhr") {
        if (!response.ok()) {
          console.error(`[API ERROR] ${testInfo.title}: ${response.status()} ${response.request().method()} ${response.url()}`);
        } else {
          // Captures network when clicking a button that triggers a fetch
          console.log(`[NETWORK INFO] ${testInfo.title}: ${response.status()} ${response.request().method()} ${response.url()}`);
        }
      }
    });

    await use(page);
  },

  // 1. Define the auto-fixture (it runs automatically for every test)
  allureBddMapper: [async ({}, use, testInfo) => {
    // 2. Loop through all Gherkin tags applied to the current Scenario
    for (const tag of testInfo.tags) {
      const cleanTag = tag.replace('@', ''); // Remove the '@' symbol
      
      // 3. Map tags to Allure APIs
      if (cleanTag.startsWith('epic:')) allure.epic(cleanTag.split(':')[1].replace(/_/g, ' '));
      if (cleanTag.startsWith('feature:')) allure.feature(cleanTag.split(':')[1].replace(/_/g, ' '));
      if (cleanTag.startsWith('story:')) allure.story(cleanTag.split(':')[1].replace(/_/g, ' '));
      if (cleanTag.startsWith('severity:')) allure.severity(cleanTag.split(':')[1]);
      
      // Bonus: Turn Jira tags into clickable links in the Allure report!
      if (cleanTag.startsWith('jira:')) {
        const issueId = cleanTag.split(':')[1];
        // Just pass the ID! Playwright config handles the URL formatting.
        allure.issue(issueId); 
      }
    }
    
    await use(); // Continue with the test execution
  }, { auto: true }], // The 'auto: true' flag ensures you don't have to call it manually  

  context: async ({ context }, use) => {
    // Add script to collect coverage data before page unload
    await context.addInitScript(() =>
      window.addEventListener("beforeunload", () =>
        (window as any).collectIstanbulCoverage(
          JSON.stringify((window as any).__coverage__),
        ),
      ),
    );

    // Create directory for coverage data if it doesn't exist
    if (!fs.existsSync(istanbulCLIOutput)) {
      await fs.promises.mkdir(istanbulCLIOutput, { recursive: true });
    }

    // Expose function to browser context for collecting coverage data
    await context.exposeFunction(
      "collectIstanbulCoverage",
      (coverageJSON: string) => {
        if (coverageJSON) {
          const coverage = JSON.parse(coverageJSON);
          const remapped: Record<string, any> = {};
          
          // CRITICAL FIX: Use the host workspace path if in CI, otherwise use local cwd
          const hostWorkspace = process.env.HOST_WORKSPACE_PATH || process.cwd();
          const srcDir = path.join(hostWorkspace, "src");
          
          for (const [key, value] of Object.entries(coverage)) {
            // Replaces the internal Docker path with the correct host path
            const newPath = key.replace(/^\/app\/src\//, srcDir + "/");
            const entry = value as any;
            entry.path = newPath;
            remapped[newPath] = entry;
          }

          // Write coverage data to a unique file
          fs.writeFileSync(
            path.join(
              istanbulCLIOutput,
              `playwright_coverage_${generateUUID()}.json`,
            ),
            JSON.stringify(remapped),
          );
        }
      },
    );

    // Use the modified context in tests
    await use(context);

    // After tests complete, collect coverage data from all open pages
    for (const page of context.pages()) {
      await page.evaluate(() =>
        (window as any).collectIstanbulCoverage(
          JSON.stringify((window as any).__coverage__),
        ),
      );
    }
  },
});

/**
 * Export the expect function for assertions in tests
 */
export const expect = test.expect;
