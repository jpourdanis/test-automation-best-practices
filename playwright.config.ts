import { PlaywrightTestConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const testDir = defineBddConfig({
  features: "e2e/features/*.feature",
  steps: "e2e/tests/bdd.spec.ts",
});

const config: PlaywrightTestConfig = {
  // Directory containing Playwright tests
  testDir: "e2e",
  // Where to store visual snapshots
  snapshotDir: "e2e/snapshots",
  // Template used for snapshot paths
  snapshotPathTemplate: "e2e/snapshots/{arg}{ext}",
  // When running in CI/Docker we expect the app to be started externally
  webServer: process.env.CI
    ? undefined
    : {
        command: "docker-compose up",
        port: 3000,
        timeout: 120000, // 2 minutes timeout for server to start
        reuseExistingServer: true,
      },
  projects: [
    {
      name: "Chrome",
      use: {
        ...devices["Desktop Chrome"],
      },
      // Exclude BDD tests from the default Chrome run to avoid duplicate runs
      testIgnore: /.*\.feature\.spec.*$/, 
    },
    {
      name: "BDD",
      testDir,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    ...(process.env.CROSS_BROWSER === "true"
      ? [
          {
            name: "Firefox",
            use: {
              ...devices["Desktop Firefox"],
            },
            testMatch: /.*cross-browser\.spec\.ts/,
          },
          {
            name: "WebKit",
            use: {
              ...devices["Desktop Safari"],
            },
            testMatch: /.*cross-browser\.spec\.ts/,
          },
          {
            name: "Chrome",
            use: {
              ...devices["Desktop Chrome"],
            },
            testMatch: /.*cross-browser\.spec\.ts/,
          },
        ]
      : []),
  ],
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    video: "retain-on-failure",
    trace: "retain-on-failure",
    baseURL: process.env.BASE_URL || "http://localhost:3000",
  },
  reporter: process.env.CI
    ? [
        ["allure-playwright"],
        ["list"],
        ["html", { open: "never" }],
      ]
    : [
        ["html", { open: "never" }],
        ["allure-playwright"],
        ["list"],
      ],
};

export default config;
