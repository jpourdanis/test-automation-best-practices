import * as fs from "fs";
import * as path from "path";
import { test as baseTest } from "@playwright/test";
import { generateUUID } from "./helper";
import { HomePage } from "./pages/HomePage";

/**
 * Directory where Istanbul will store coverage data
 * Uses the current working directory to create a .nyc_output folder
 */
const istanbulCLIOutput = path.join(process.cwd(), ".nyc_output");

/**
 * Removes the existing coverage directory if it exists
 * This ensures we start with a clean slate for each test run
 */
function cleanupCoverageDir() {
  if (fs.existsSync(istanbulCLIOutput)) {
    try {
      fs.rmSync(istanbulCLIOutput, { recursive: true, force: true });
      console.log(`Deleted existing .nyc_output folder`);
    } catch (err: any) {
      // Ignore EBUSY or other transient filesystem errors when running
      // inside containers where the directory may be mounted from the host
      if (err && err.code === "EBUSY") {
        console.warn(
          `Could not remove .nyc_output (EBUSY). Proceeding without cleanup.`,
        );
      } else {
        console.warn(`Could not remove .nyc_output: ${err?.message || err}`);
      }
    }
  }
}

// Initialize by cleaning up any previous coverage data
// Only clean up once per process to avoid workers deleting each other's data
if (!process.env.COVERAGE_CLEANED) {
  cleanupCoverageDir();
  process.env.COVERAGE_CLEANED = "true";
}

/**
 * Extended Playwright test fixture that adds code coverage collection
 * This adds Istanbul coverage support to all tests using this fixture
 */
export const test = baseTest.extend<{ homePage: HomePage }>({
  // Automatically instantiate Page Objects
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

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
          // Remap Docker container paths (/app/src/...) to host paths
          // so nyc can resolve source files and generate valid lcov output
          const coverage = JSON.parse(coverageJSON);
          const remapped: Record<string, any> = {};
          const srcDir = path.join(process.cwd(), "src");
          for (const [key, value] of Object.entries(coverage)) {
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
