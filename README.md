# Test Automation Best Practices in Action

[![Coverage Status](https://coveralls.io/repos/github/jpourdanis/playwright-test-coverage/badge.svg?branch=main)](https://coveralls.io/github/jpourdanis/playwright-test-coverage?branch=main)
[![CI](https://github.com/jpourdanis/playwright-test-coverage/actions/workflows/ci.yml/badge.svg)](https://github.com/jpourdanis/playwright-test-coverage/actions/workflows/ci.yml)

![Demo Animation](demo.webp)

A comprehensive reference project demonstrating **test automation engineering best practices** using [Playwright](https://playwright.dev). This repository goes beyond simple end-to-end tests to showcase the patterns, architectures, and strategies that make a test suite **robust, maintainable, and scalable**.

## Table of Contents

- [Best Practices Implemented](#best-practices-implemented)
  - [1. Page Object Model (POM)](#1-page-object-model-pom)
  - [2. Accessibility (a11y) Testing](#2-accessibility-a11y-testing)
    - [Handling i18n with Accessibility Locators](#handling-i18n-with-accessibility-locators)
  - [3. Network Mocking & Interception](#3-network-mocking--interception)
  - [4. Visual Regression & Responsive Testing](#4-visual-regression--responsive-testing)
  - [5. Data-Driven Testing](#5-data-driven-testing)
  - [6. E2E Code Coverage](#6-e2e-code-coverage)
  - [7. Consistent Cross-Platform Testing with Docker](#7-consistent-cross-platform-testing-with-docker)
  - [8. Allure Reports with Historical Data & Flaky Test Detection](#8-allure-reports-with-historical-data--flaky-test-detection)
  - [9. Cross-Browser Testing Strategy](#9-cross-browser-testing-strategy)
  - [10. Behavior-Driven Development (BDD) with Cucumber](#10-behavior-driven-development-bdd-with-cucumber)
  - [11. Nightly Builds & Scheduled Playwright Runs](#11-nightly-builds--scheduled-playwright-runs)
  - [12. Avoiding Static Waits with waitForResponse](#12-avoiding-static-waits-with-waitforresponse)
  - [13. Hybrid E2E Testing](#13-hybrid-e2e-testing)
  - [14. Test Automation Pyramid: API First](#14-test-automation-pyramid-api-first)
  - [15. API Schema Validation with Zod](#15-api-schema-validation-with-zod)
  - [16. Random Data Generation with faker.js](#16-random-data-generation-with-fakerjs)
  - [17. Static Code Analysis with MegaLinter](#17-static-code-analysis-with-megalinter)
- [Getting Started](#getting-started)

---

## Best Practices Implemented

### 1. Page Object Model (POM)

**Files:** [`e2e/pages/HomePage.ts`](/e2e/pages/HomePage.ts) · [`e2e/tests/pom-refactored.spec.ts`](/e2e/tests/pom-refactored.spec.ts)

#### What is it?

The Page Object Model is a design pattern that creates an abstraction layer between your tests and the page structure. Instead of scattering selectors like `page.locator("header")` across dozens of test files, you define them **once** inside a dedicated class.

#### Why it matters

- **Maintainability** — When a selector changes (e.g., a button class is renamed), you update it in **one place** instead of every test file that references it.
- **Readability** — Tests read like user stories: `homePage.clickColorButton("Red")` is instantly understandable, even by non-engineers.
- **Reusability** — The same page object is shared across multiple test suites, eliminating duplicated boilerplate.

#### How to implement

**Step 1:** Create a page class with locators and actions:

```typescript
// e2e/pages/HomePage.ts
import { Page, Locator } from "@playwright/test";

export class HomePage {
  readonly page: Page;
  readonly header: Locator;
  readonly currentColorText: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator("header");
    this.currentColorText = page.locator("text=Current color:");
  }

  async goto() {
    await this.page.goto("/");
  }

  async clickColorButton(colorName: string) {
    await this.page.click(`text=${colorName}`);
  }
}
```

**Step 2:** Use the page object in your tests:

```typescript
// e2e/tests/pom-refactored.spec.ts
test.describe("POM Refactored: Background color tests", () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test("verify Red is applied as the background color", async () => {
    await homePage.clickColorButton("Red");
    const text = await homePage.getCurrentColorText();
    // ... assertions
  });
});
```

#### How to verify

```bash
npx playwright test e2e/tests/pom-refactored.spec.ts
```

---

### 2. Accessibility (a11y) Testing

**File:** [`e2e/tests/a11y.spec.ts`](/e2e/tests/a11y.spec.ts)

#### What is it?

Automated accessibility auditing that scans your rendered DOM against the [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/standards-guidelines/wcag/). We use [`@axe-core/playwright`](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright) — the same engine used by browser DevTools accessibility audits.

#### Why it matters

- **Inclusivity** — Ensures the application is usable by individuals with visual, motor, or cognitive disabilities.
- **Legal compliance** — Many jurisdictions require WCAG AA compliance for public-facing web applications.
- **Regression prevention** — A CSS refactor can silently break color contrast ratios. An automated a11y gate catches it before merge.
- **Real bugs found** — In this project, the a11y tests uncovered actual contrast violations (white text on yellow/turquoise backgrounds) and missing semantic landmarks (`<main>`, `<h1>`) that were subsequently fixed.

#### How to implement

**Step 1:** Install the dependency:

```bash
npm install -D @axe-core/playwright
```

**Step 2:** Write a test that scans the page:

```typescript
// e2e/tests/a11y.spec.ts
import AxeBuilder from "@axe-core/playwright";

test("should not have any accessibility issues", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

**Step 3:** Test accessibility **after state changes** too — a button click that changes the background color could introduce new contrast violations:

```typescript
test("should maintain accessibility after color change", async ({ page }) => {
  await homePage.clickColorButton("Yellow");
  const results = await new AxeBuilder({ page }).analyze();
  const contrastViolations = results.violations.filter(
    (v) => v.id === "color-contrast"
  );
  expect(contrastViolations).toEqual([]);
});
```

#### How to verify

```bash
npx playwright test e2e/tests/a11y.spec.ts
```

If a violation is found, the output will include the exact rule ID (e.g., `color-contrast`), the failing HTML element, and the specific contrast ratio that failed.

#### Handling i18n with Accessibility Locators

**File:** [`e2e/tests/a11y.spec.ts`](/e2e/tests/a11y.spec.ts)

When an application has different languages, most engineers panic because their trusted English text locators would break once they change the testing language. 

So they abandon accessibility locators and fallback to the dark ages of DOM manipulation. They start writing locators like this:

🚩 `page.locator('.form-group .btn.btn-primary .submit-btn')`  
🚩 `page.locator('//div[@class="login-container"]/div[2]/form/button')`

This is how flaky pipelines are born, and the confidence in the testing is ruined. A developer adds one extra wrapper `div` for a layout tweak, and your entire test suite breaks.

There is a much cleaner way to handle this in Playwright. Your testing framework just needs a single source of truth. Keep it simple: load the correct language JSON file at runtime (e.g., using an environment variable, test parameters, or straight imports). Then you just pass that dynamic dictionary right back into your resilient Playwright locators:

```typescript
// Example: locating a button dynamically based on the current testing language
await page.getByRole('button', { name: i18nConfig.colors.red }).click();
```

Playwright inserts the correct string automatically. English, French, Spanish, or whatsoever — it does not matter. You keep the user-centric accessibility locators and ditch the brittle DOM paths. 

Do not compromise your architecture just because the text changes. Smart systems adapt to the context. Adding an additional language to the framework is done under a minute.

---

### 3. Network Mocking & Interception

**File:** [`e2e/tests/network-mocking.spec.ts`](/e2e/tests/network-mocking.spec.ts)

#### What is it?

Playwright's `page.route()` API allows you to intercept any network request and either **abort** it (simulating a failure) or **fulfill** it with custom data (mocking an API response).

#### Why it matters

- **Test isolation** — Tests don't depend on live APIs, databases, or third-party services. They run fast and never flake due to network issues.
- **Edge case coverage** — You can simulate states that are difficult to reproduce naturally: API errors, empty responses, rate limits, or missing assets.
- **Speed** — Mocked responses return instantly, dramatically reducing test execution time for API-heavy applications.

#### How to implement

**Aborting a request** (simulating a missing asset):

```typescript
test("should handle missing image gracefully", async ({ page }) => {
  // Intercept and abort the logo request BEFORE navigating
  await page.route("**/logo.svg", (route) => route.abort());
  await page.goto("/");

  // The image element should still exist in the DOM with its alt text
  const logoImg = page.getByRole("img", { name: "logo" });
  await expect(logoImg).toHaveAttribute("alt", "logo");
});
```

**Mocking data that doesn't exist in the database** (e.g., a brand-new color):

```typescript
test("should display colors that do not exist in the database", async ({ page }) => {
  // Mock the /api/colors endpoint to return a color not in the real DB
  await page.route("**/api/colors", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ name: "Magenta", hex: "#ff00ff" }]),
    });
  });

  // Also mock the individual color endpoint
  await page.route("**/api/colors/Magenta", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ name: "Magenta", hex: "#ff00ff" }),
    });
  });

  await homePage.goto();

  // Use accessible locators to find and click the mocked color button
  const customBtn = page.getByRole("button", { name: "colors.magenta" });
  await customBtn.click();

  // Verify the background reflects the mocked hex value
  await expect(homePage.header).toHaveCSS("background-color", "rgb(255, 0, 255)");
});
```

**Handling a color not found (404 response)**:

```typescript
import enTranslations from "../../src/locales/en.json";

test("should gracefully handle a color not found in the database", async ({ page }) => {
  await page.route("**/api/colors", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { name: "Turquoise", hex: "#1abc9c" },
        { name: "Red", hex: "#e74c3c" },
      ]),
    });
  });

  // Simulate a 404 for the "Red" color endpoint
  await page.route("**/api/colors/Red", async (route) => {
    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ error: "Color not found" }),
    });
  });

  await homePage.goto();
  await expect(homePage.header).toHaveCSS("background-color", "rgb(26, 188, 156)");

  // Use i18n-aware accessible locator for the button
  const redBtn = page.getByRole("button", { name: enTranslations.colors.red });
  await redBtn.click();

  // Background should not have changed since the API returned a 404
  await expect(homePage.header).toHaveCSS("background-color", "rgb(26, 188, 156)");
});
```

> **Important:** Always call `page.route()` *before* the action that triggers the network request (e.g., `page.goto()`).

#### How to verify

```bash
npx playwright test e2e/tests/network-mocking.spec.ts
```

---

### 4. Visual Regression & Responsive Testing

**File:** [`e2e/tests/visual.spec.ts`](/e2e/tests/visual.spec.ts)

This file combines two complementary testing practices into a single suite: **visual regression** (pixel-level screenshot comparison) and **responsive design** (mobile viewport verification).

#### 4a. Visual Regression

##### What is it?

Visual regression testing captures a full-page screenshot and compares it pixel-by-pixel against a previously approved baseline image. If there's a difference, the test fails and generates a visual diff highlighting exactly what changed.

##### Why it matters

- **Catches what functional tests miss** — A CSS change that shifts a button 5 pixels to the left won't break any functional assertion, but it will break a visual snapshot.
- **Ideal for static content** — Pages like FAQs, landing pages, or dashboards benefit enormously from visual testing because their layout is their primary "feature."
- **Confidence in refactors** — When refactoring CSS or updating components, visual tests confirm nothing changed unexpectedly.

##### How to implement

```typescript
test.describe("Visual Regression", () => {
  test("homepage should match snapshot", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("header");

    // Mask the animated logo so its CSS animation doesn't cause flaky diffs
    const screenshot = await page.screenshot({
      fullPage: true,
      mask: [page.locator(".App-logo")],
    });
    expect(screenshot).toMatchSnapshot("home.png");
  });
});
```

> **Tip — Masking animated elements:** The `mask` option accepts an array of locators. Playwright paints a solid-color block over each matched element before capturing the screenshot. Use it for any element with CSS animations, GIFs, or other non-deterministic visuals (e.g., carousels, loading spinners) that would otherwise produce false-positive pixel diffs between runs.

> **Important:** Visual regression baselines should be generated inside Docker to avoid OS-specific rendering differences. See [Section 7: Consistent Cross-Platform Testing with Docker](#7-consistent-cross-platform-testing-with-docker).

#### 4b. Responsive / Viewport Testing

##### What is it?

Testing your application under specific viewport dimensions to simulate how it renders on mobile phones, tablets, or other non-desktop devices.

##### Why it matters

- **Mobile-first reality** — Over 50% of global web traffic comes from mobile devices. Buttons that overlap or text that overflows can make an app unusable on a phone.
- **Layout regression prevention** — A CSS change on desktop can inadvertently break the mobile layout. Viewport tests catch these regressions automatically.
- **Cross-device confidence** — You verify functional correctness (not just appearance) at constrained dimensions — buttons can still be clicked, text is still readable.

##### How to implement

```typescript
test.describe("Responsive Design Testing", () => {
  // Simulate an iPhone SE viewport
  test.use({ viewport: { width: 375, height: 667 } });

  test("should render correctly on mobile viewport", async ({ page }) => {
    await page.goto("/");

    // Verify all critical elements are visible
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("text=Turquoise")).toBeVisible();
    await expect(page.locator("text=Red")).toBeVisible();
    await expect(page.locator("text=Yellow")).toBeVisible();

    // Verify interactions still work at this size
    await page.click("text=Yellow");
    const text = await page.locator("text=Current color:").textContent();
    expect(text).toContain("#f1c40f");
  });
});
```

#### How to verify

```bash
npx playwright test e2e/tests/visual.spec.ts
```

Use Playwright's UI mode (`npx playwright test --ui`) to visually inspect how the page renders at the constrained viewport.

---

### 5. Data-Driven Testing

**File:** [`e2e/tests/data-driven.spec.ts`](/e2e/tests/data-driven.spec.ts)

#### What is it?

A pattern where a single test template is executed multiple times with different input data. Instead of writing three nearly identical tests for three colors, you define the data once and generate the tests programmatically.

#### Why it matters

- **DRY (Don't Repeat Yourself)** — The test logic is written once. Adding a new test case means adding one line to the data array, not copying an entire test block.
- **Scalability** — When your application adds a fourth or fifth color, you add one object to the array and get full test coverage instantly.
- **Consistency** — Every data point goes through the exact same assertion pipeline, eliminating the risk of copy-paste bugs in duplicated test blocks.

#### How to implement

**Step 1:** Define the test dataset:

```typescript
const testData = [
  { name: "Turquoise", expectedHex: "#1abc9c", expectedRgb: "rgb(26, 188, 156)" },
  { name: "Red",       expectedHex: "#e74c3c", expectedRgb: "rgb(231, 76, 60)"  },
  { name: "Yellow",    expectedHex: "#f1c40f", expectedRgb: "rgb(241, 196, 15)"  },
];
```

**Step 2:** Loop over the data to generate tests:

```typescript
test.describe("Data-Driven Testing", () => {
  for (const data of testData) {
    test(`changing color to ${data.name} should reflect in UI and DOM`, async ({ page }) => {
      await homePage.clickColorButton(data.name);
      await expect(homePage.currentColorText).toContainText(data.expectedHex);
      await expect(homePage.header).toHaveCSS("background-color", data.expectedRgb);
    });
  }
});
```

#### How to verify

```bash
npx playwright test e2e/tests/data-driven.spec.ts
```

The output will list **three distinct test names** — one per dataset entry — confirming that a single test block generated multiple independent executions.

---

### 6. E2E Code Coverage

**Files:** [`e2e/baseFixtures.ts`](/e2e/baseFixtures.ts) · [`e2e/tests/coverage.spec.ts`](/e2e/tests/coverage.spec.ts)

#### What is it?

Code coverage measurement for **end-to-end tests**, not just unit tests. Using [Istanbul/nyc](https://github.com/istanbuljs/nyc), we instrument the application at build time and collect coverage data from the browser during Playwright test execution. This tells you exactly which lines, branches, and functions of your source code are exercised by your E2E suite.

#### Why it matters

- **Identifies blind spots** — Shows which parts of your codebase have no E2E test coverage, guiding you on where to write the next test.
- **Measures test effectiveness** — A test suite with 200 tests but 30% coverage has fundamental gaps. Coverage metrics make this visible.
- **CI/CD integration** — Coverage data is uploaded to [Coveralls](https://coveralls.io/) on every push, providing historical trends and PR-level deltas.
- **Stakeholder communication** — Coverage percentages are easy to understand and share with product managers and engineering leads.

#### How it works

The custom `baseFixtures.ts` extends Playwright's test runner to:

1. **Inject** a `beforeunload` listener that serializes Istanbul's `__coverage__` object
2. **Expose** a `collectIstanbulCoverage` function to the browser context
3. **Collect** coverage data from every open page after each test completes
4. **Write** coverage JSON files to `.nyc_output/` with unique UUIDs

#### How to implement

**Step 1:** Ensure your build pipeline includes `babel-plugin-istanbul` (controlled via the `USE_BABEL_PLUGIN_ISTANBUL` env var).

**Step 2:** Import from `baseFixtures` instead of `@playwright/test`:

```typescript
// e2e/tests/coverage.spec.ts
import { test, expect } from "../baseFixtures"; // ← NOT from @playwright/test
```

**Step 3:** Write your tests as usual — coverage collection is automatic.

#### Generating reports

```bash
# Run tests with coverage collection
npm run coverage

# Or generate reports manually:
npx nyc report --reporter=html    # HTML report → coverage/index.html
npx nyc report --reporter=lcov    # For Coveralls / Codecov upload
npx nyc report --reporter=text    # CLI summary table
```

#### How to verify

```bash
npm run coverage
```

The CLI will output a table showing per-file statement, branch, function, and line coverage percentages.

---

### 7. Consistent Cross-Platform Testing with Docker

#### What is it?

A Docker-based testing environment that guarantees identical rendering and test behavior across all machines — developer laptops, CI servers, and staging environments.

#### Why it matters

Visual regression tests are particularly sensitive to cross-platform differences. A screenshot taken on **macOS** will differ from one taken on **Linux** due to subtle variations in:

- **Font rendering** — macOS uses Core Text, Linux uses FreeType — same font, different pixels
- **Anti-aliasing** — Sub-pixel smoothing algorithms differ between OSes
- **System fonts** — Default fallback fonts vary across platforms

These differences cause **false positives**: tests pass locally on macOS but fail in Linux-based CI, or vice versa. This erodes trust in the test suite and wastes debugging time.

#### The solution

We use Docker with the official [Playwright Docker image](https://hub.docker.com/_/microsoft-playwright) (`mcr.microsoft.com/playwright`) to lock the rendering environment. Our `docker-compose.yml` defines two services:

```
docker-compose.yml
├── app service         → Runs the React dev server on port 3000
└── playwright service  → Runs Playwright tests against the app
```

**Dockerfile** (simplified):

```dockerfile
FROM mcr.microsoft.com/playwright:v1

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

CMD ["npm", "test"]
```

**Key Docker Compose features:**

- **Consistent rendering** — The official Playwright image pins browser versions and system libraries
- **Volume mounts** — Snapshots (`e2e/snapshots/`) and test results (`test-results/`) persist between container runs, so updated baselines are always available on the host
- **CI-ready** — The same Docker configuration runs locally and in GitHub Actions

#### How to use

```bash
# Run the full test suite in Docker
npm run test:e2e:docker

# Update visual regression baselines (after intentional UI changes)
npm run test:e2e:docker:update
```

> [!CAUTION]
> **Local prerequisite — remove BuildKit cache mounts.**
> The `Dockerfile` and `server/Dockerfile` use `RUN --mount=type=cache` syntax which requires Docker BuildKit. This works automatically in GitHub Actions (CI), but the local `docker-compose` (v1) does **not** support BuildKit by default and will fail with:
> ```
> the --mount option requires BuildKit
> ```
> Before running locally, replace the cache-mount `RUN` lines in both files:
>
> **`Dockerfile`** (line ~8) and **`server/Dockerfile`** (line ~6):
> ```dockerfile
> # ❌ CI-only — remove locally
> RUN --mount=type=cache,target=/root/.npm \
>     npm ci --legacy-peer-deps
>
> # ✅ Replace with plain npm ci
> RUN npm ci --legacy-peer-deps
> ```
> Remember to **revert this change** before pushing, since the cache mount improves CI build speed significantly.

> **Tip:** Always review visual diffs before accepting updated baselines. Never blindly run `--update-snapshots`.

---

### 8. Allure Reports with Historical Data & Flaky Test Detection

👉 **[View the Live Allure Report for this Repository](https://jpourdanis.github.io/test-automation-best-practices/)**

#### What is it?

[Allure Framework](https://allurereport.org/) is a flexible lightweight multi-language test report tool that not only shows a very concise representation of what has been tested in a neat web report form, but allows everyone participating in the development process to extract maximum useful information from everyday execution of tests. We've integrated `allure-playwright` to automatically generate these reports.

#### Why it matters

- **Historical Data** — Standard Playwright HTML reports are ephemeral; they overwrite on the next run. Allure maintains a history of test executions, allowing you to see trends over time (e.g., "this test has been failing for the last 5 builds").
- **Flaky Test Detection** — Because Allure tracks history, it can easily identify "flaky" tests—tests that pass and fail intermittently without code changes. This is crucial for maintaining a trustworthy test suite.
- **Rich Visualizations** — Allure categorizes failures into Product Defects (bugs) and Test Defects (broken tests), providing a clear dashboard for stakeholders to understand the health of the application.
- **Attachments** — Screenshots (like visual regression diffs), videos, and traces collected by Playwright are natively embedded into the Allure report for easy debugging.

#### How to implement

**Step 1:** Install the necessary packages.

```bash
npm install -D allure-playwright
npm install -g allure-commandline # For viewing reports locally
```

**Step 2:** Configure Playwright to use the Allure reporter in `playwright.config.ts`.

```typescript
  reporter: process.env.CI
    ? [
        ["allure-playwright"],
        ["list"],
      ]
    : [
        ["html", { open: "never" }],
        ["allure-playwright"],
        ["list"],
      ],
```

**Step 3:** Use GitHub Actions to build and publish the report with historical data.

Our CI workflow uses `simple-elf/allure-report-action` to build the report. Crucially, it fetches the previous `allure-history` from the `gh-pages` branch, allowing Allure to compute trends. It then publishes the updated report back to GitHub Pages.

#### How to verify

To view the report locally after running tests:

```bash
npx allure serve allure-results
```

In CI, navigate to the repository's GitHub Pages URL after a build finishes to view the continually updated historical report.

---

### 9. Cross-Browser Testing Strategy

**File:** [`playwright.config.ts`](/playwright.config.ts) · [`e2e/tests/cross-browser.spec.ts`](/e2e/tests/cross-browser.spec.ts)

#### What is it?

A conditional strategy for running tests across multiple browser engines (Chromium, Firefox, and WebKit) without permanently inflating the CI execution time for every single commit.

#### Why it matters

Many teams configure Playwright to run every test on all three browsers. While this provides great coverage, it multiplies your test execution time by 3. If a PR takes 15 minutes to run UI tests on Chrome, it will take 45 minutes to run all three browsers. This destroys the developer feedback loop.

The senior QA best practice is **Conditional Execution**:
1. **Pull Requests / Local Dev:** Run tests fast on one primary engine (e.g., Chromium).
2. **Nightly / Release Branches:** Run full regression across all browsers using an environment variable flag.

#### How to implement

We configure our `playwright.config.ts` to dynamically inject browser projects based on an environment variable (`CROSS_BROWSER`):

```typescript
  projects: [
    {
      name: "Chrome",
      use: { ...devices["Desktop Chrome"] },
    },
    // Conditionally load other browsers only when requested
    ...(process.env.CROSS_BROWSER === "true"
      ? [
          { name: "Firefox", use: { ...devices["Desktop Firefox"] } },
          { name: "WebKit",  use: { ...devices["Desktop Safari"] } },
        ]
      : []),
  ],
```

#### How to verify

**Run fast on default browser (Chromium only):**
```bash
npm run test
```

**Run deep coverage across all engines (Chromium, Firefox, WebKit):**
```bash
npm run test:cross-browser
```

---

### 10. Behavior-Driven Development (BDD) with Cucumber

**Files:** [`e2e/features/home.feature`](/e2e/features/home.feature) · [`e2e/tests/bdd.spec.ts`](/e2e/tests/bdd.spec.ts)

#### What is it?

Behavior-Driven Development (BDD) closes the gap between business stakeholders and QA engineers by expressing tests in plain English using Gherkin syntax. We use [`playwright-bdd`](https://github.com/vitalets/playwright-bdd) to seamlessly compile `.feature` files into native Playwright tests.

#### Why it matters

- **Living Documentation** — Your test artifacts serve as the actual source of truth for product requirements.
- **Improved Collaboration** — Product Managers can review or even write the Gherkin scenarios without needing to understand TypeScript or Playwright APIs.
- **Reusability** — The step definitions (`bdd.spec.ts`) leverage the same Page Object Models used by standard end-to-end tests, maximizing reusability and reducing duplication.

#### How to implement

**Step 1:** Write a Gherkin feature file outlining the desired behavior:

```gherkin
# e2e/features/home.feature
Feature: Home Page Background Color

  Scenario Outline: Change background color
    Given I am on the home page
    When I click the "<color>" color button
    Then the background color should be "<rgb>"

    Examples:
      | color     | rgb                |
      | Turquoise | rgb(26, 188, 156)  |
```

**Step 2:** Write the Step Definitions using Playwright and your Page Objects:

```typescript
// e2e/tests/bdd.spec.ts
import { createBdd } from "playwright-bdd";
import { HomePage } from "../pages/HomePage";

const { Given, When, Then } = createBdd();
let homePage: HomePage;

Given("I am on the home page", async ({ page }) => {
  homePage = new HomePage(page);
  await homePage.goto();
});
// ... Map other steps
```

#### How to verify

Execute the BDD tests specifically:
```bash
npm run test:bdd
```

---

### 11. Nightly Builds & Scheduled Playwright Runs

**File:** [`.github/workflows/ci.yml`](/.github/workflows/ci.yml)

#### What is it?

A scheduled Continuous Integration (CI) run that executes the entire test suite unconditionally at a specific time every day (e.g., midnight), regardless of whether any commits were pushed.

#### Why it matters

- **Cross-Browser Verification** — As discussed in the [Cross-Browser Testing Strategy](#9-cross-browser-testing-strategy), running every test on Firefox, WebKit, and Chrome on every single Pull Request can severely drag down performance. Nightly builds allow you to run the **complete deep-dive matrix** covering all supported platform, OS constraints, and scenarios while the team is asleep.
- **External Dependency Monitoring** — Real-world apps depend on third-party APIs, CDNs, or downstream services that are frequently out of your control. If a third-party gateway changes its response payload silently, a scheduled regression test will report the failure before morning.
- **Flaky Test Identification** — Flaky tests manifest more accurately when tested passively alongside other background systemic disturbances. Finding these via scheduled runs increases confidence during fast-moving days.

#### How to implement

Using GitHub actions, we configure the `schedule` keyword paired with a standard [cron syntax representation](https://crontab.guru/):

```yaml
on:
  push:
    branches: [main, gh-pages]
  pull_request:
    branches: [main, gh-pages]
  schedule:
    - cron: '0 0 * * *' # Executes daily at Midnight UTC
```

This guarantees an autonomous system health check every day.

---

### 12. Avoiding Static Waits with `waitForResponse`

**File:** [`e2e/tests/visual.spec.ts`](/e2e/tests/visual.spec.ts)

#### What is it?

Using Playwright's `page.waitForResponse()` to synchronise test execution with asynchronous network activity, instead of inserting arbitrary time delays (`page.waitForTimeout`).

#### Why it matters

`page.waitForTimeout(2000)` is the most common anti-pattern in Playwright. It has two failure modes:

- **Too short** — the request hasn't completed yet, so the assertion fails on a fast machine
- **Too long** — you're wasting seconds on every test run, even when the request resolves in 100ms

A slow Docker network or a busy CI runner exaggerates both problems. The test becomes **non-deterministic**: it passes locally and fails in CI for no obvious reason.

#### How to implement

The key insight is: **register the listener before the action that fires the request**. This guarantees you never miss the network event, even if the response arrives before the `await` is reached.

```typescript
// ❌ Anti-pattern — arbitrary delay, non-deterministic
await homePage.clickColorButton("Yellow");
await page.waitForTimeout(2000); // Hope the API responds within 2s
const hex = await homePage.getCurrentColorText();
expect(hex).toContain("#f1c40f");

// ✅ Best practice — deterministic, no wasted time
// 1. Register the listener BEFORE the click
const responsePromise = page.waitForResponse(
  resp => resp.url().includes('/api/colors/Yellow') && resp.status() === 200
);
// 2. Fire the action
await homePage.clickColorButton("Yellow");
// 3. Await the response (resolves as soon as it arrives)
await responsePromise;
// 4. Use auto-retrying assertion to handle React state update
await expect(homePage.currentColorText).toContainText("#f1c40f");
```

This pattern:
- **Eliminates flakiness** caused by network timing variance
- **Speeds up tests** — no sleeping, the assertion runs the instant the response lands
- **Self-documents the intent** — it's immediately clear the test is waiting for a specific API call

> **Why not `Promise.all([waitForResponse, click])`?** That pattern is needed when action and response race simultaneously (e.g., navigation). For a button click that triggers a fetch, you have a small but safe window between registering the listener and firing the click — `waitForResponse` is set up before any network activity begins, so nothing is missed.

#### How to verify

```bash
npm run test:e2e:docker
```

---

### 13. Hybrid E2E Testing

**File:** [`e2e/tests/hybrid.spec.ts`](/e2e/tests/hybrid.spec.ts)

#### What is it?

A hybrid test leverages both backend API calls and frontend UI interactions in a single test case. Instead of clicking through the UI to create a resource or set up a specific state, the test uses the `request` fixture to interact directly with the API to set the system under test to the desired state. It then navigates to the UI to verify the required behavior.

#### Why it matters

- **Unmatched Speed** — Setting up test state via the UI involves waiting for pages to load, animations to finish, and multiple clicks to register. API setup takes milliseconds.
- **Improved Reliability (Less Flake)** — The UI layer is inherently brittle. Bypassing the UI for the "arrange" phase of a test drastically reduces false negatives caused by UI flakiness in parts of the application that are not the primary focus of the test.
- **True Isolation** — You can create and delete exact data permutations for the specific test without relying on existing database fixtures.

#### How to implement

**Step 1:** Use `request` (Playwright's APIRequestContext) to arrange the state directly.
**Step 2:** Use `page` to act and assert on the frontend UI.
**Step 3:** Use `request` to clean up the state to keep the environment stateless.

```typescript
// e2e/tests/hybrid.spec.ts
import { test, expect } from "../baseFixtures";
import { HomePage } from "../pages/HomePage";

test("should create color via API and verify through UI", async ({ page, request }) => {
  const newColor = { name: "Purple", hex: "#8e44ad" };
  
  // 1. Arrange - Fast state setup via API
  const createResponse = await request.post("/api/colors", { data: newColor });
  expect(createResponse.ok()).toBeTruthy();

  // 2. Act - Navigate and interact via UI
  const homePage = new HomePage(page);
  await homePage.goto();
  
  const responsePromise = page.waitForResponse(
    (resp) => resp.url().includes(`/api/colors/${newColor.name}`) && resp.status() === 200
  );
  await page.getByRole("button", { name: "colors.purple" }).click();
  await responsePromise;

  // 3. Assert - Validating UI reflects the state correctly
  await expect(homePage.currentColorText).toContainText(newColor.hex);

  // 4. Teardown - Clean up via API to maintain isolation
  await request.delete(`/api/colors/${newColor.name}`);
});
```

---

### 14. Test Automation Pyramid: API First

**File:** [`.github/workflows/ci.yml`](/.github/workflows/ci.yml)

#### What is it?

A pipeline execution strategy based on the **Test Automation Pyramid**. It strictly enforces that fast, reliable API test suites must pass before any slower, brittle UI/E2E test suites are executed.

#### Why it matters

- **Fail-Fast Feedback Loop** — If the backend is broken, there is no point in waiting for UI tests to launch, inevitably timeout, and fail. Halting the pipeline immediately saves valuable CI runner minutes.
- **Root Cause Isolation** — When UI tests fail but API tests pass, the regression is definitively isolated to the frontend presentation layer. Conversely, when API tests fail, it highlights a broken backend contract.
- **Cost Efficiency** — End-to-end Playwright tests executing full browser automation are computationally expensive compared to executing raw HTTP requests against API endpoints.

#### How to implement

In the CI workflow (`.github/workflows/ci.yml`), we declare the API testing step *without* `continue-on-error`. This instantly fails the workflow if any API endpoints regress. The subsequent E2E steps declare an `if: success()` condition, ensuring they only trigger if the API test step completes flawlessly.

```yaml
      - name: Run API tests (host Playwright)
        id: api-tests
        run: npm run test:api

      - name: Run end-to-end tests (host Playwright)
        id: e2e-tests
        continue-on-error: true
        if: success()
        run: npm test
```

---

### 15. API Schema Validation with Zod

**Files:** [`server/index.js`](/server/index.js) · [`e2e/tests/api.spec.ts`](/e2e/tests/api.spec.ts)

#### What is it?

Schema validation testing ensures that every request sent to and every response returned from an API endpoint conforms to a strictly defined data contract. In this project, **Zod** is used on both sides of the boundary:

- **Server-side** — Express route handlers validate incoming payloads against Zod schemas (`colorZodSchema`, `updateColorZodSchema`) before any database operation is performed.
- **Test-side** — Playwright API tests define a mirror `ColorSchema` and run every response through `ColorSchema.parse(data)` to guarantee the response structure hasn't drifted.

This creates a **closed validation loop**: the server rejects malformed input, and the tests reject malformed output.

#### Why it matters

- **Contract Enforcement** — Without schema validation, a backend developer could accidentally add, remove, or rename a response field and no test would notice until a downstream consumer (the UI, a mobile app, a partner integration) breaks in production. Schema parsing in tests turns this into an immediate, deterministic failure.
- **Shift-Left Testing** — Invalid payloads are caught at the API boundary before they ever reach the database layer or propagate to the frontend. A missing `name` field returns a clear `400 Bad Request` with a human-readable message (`"name is required"`) instead of a cryptic Mongoose `ValidationError` or, worse, a silent `null` stored in MongoDB.
- **Regression Safety Net** — When refactoring validation logic (e.g., switching from manual `if (!name)` checks to Zod), the Playwright API tests act as an independent safety net. If the refactored schema accidentally tightens or loosens a constraint, the test suite catches it.
- **Documentation-as-Code** — The Zod schemas serve as living, executable documentation of the API contract. Unlike an OpenAPI spec that can drift from reality, the Zod schema is enforced at runtime on every single request.
- **Negative Testing Built In** — It's not enough to test that valid requests succeed. The test suite explicitly verifies that the server **rejects** missing fields, empty strings, and malformed hex codes with the correct HTTP status and error message. This prevents regressions where error handling is accidentally removed during refactoring.

#### How to implement

**Step 1:** Define Zod schemas on the server to validate incoming request bodies.

```javascript
// server/index.js
const { z } = require('zod');

const colorZodSchema = z.object({
  name: z.string({ required_error: 'name is required' })
    .trim().min(1, 'name cannot be empty'),
  hex: z.string({ required_error: 'hex is required' })
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'hex must be a valid 6-digit hex format (e.g., #1abc9c)'),
});
```

**Step 2:** Use `safeParse` in route handlers to return structured error messages instead of crashing.

```javascript
app.post('/api/colors', async (req, res) => {
  const parseResult = colorZodSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues[0].message });
  }
  const { name, hex } = parseResult.data;
  // ... proceed with validated data
});
```

**Step 3:** In Playwright tests, define a matching Zod schema and parse every API response through it.

```typescript
// e2e/tests/api.spec.ts
import { z } from "zod";

const ColorSchema = z.object({
  name: z.string(),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

test("should create a new color with valid schema", async ({ request }) => {
  const newColor = { name: "Orange", hex: "#ffa500" };
  const response = await request.post(`/api/colors`, { data: newColor });
  expect(response.status()).toBe(201);

  const data = await response.json();
  ColorSchema.parse(data); // Throws if response shape is wrong
  expect(data).toEqual(expect.objectContaining(newColor));
});
```

**Step 4:** Write explicit **negative tests** for every validation rule to lock down the error contract.

```typescript
test("should reject missing name", async ({ request }) => {
  const response = await request.post(`/api/colors`, { data: { hex: "#ffa500" } });
  expect(response.status()).toBe(400);
  const data = await response.json();
  expect(data.error).toBe("name is required");
});

test("should reject invalid hex format", async ({ request }) => {
  const response = await request.post(`/api/colors`, { data: { name: "Orange", hex: "ffa500" } });
  expect(response.status()).toBe(400);
  const data = await response.json();
  expect(data.error).toContain("hex must be a valid 6-digit hex format");
});
```

#### How to verify

```bash
npx playwright test e2e/tests/api.spec.ts
```

The output will list all schema validation test results, confirming both positive (valid data accepted) and negative (invalid data rejected with correct status codes and messages) scenarios pass.

---

### 16. Random Data Generation with faker.js

**File:** [`e2e/tests/random-data.spec.ts`](/e2e/tests/random-data.spec.ts)

#### What is it?

Using a library like [`@faker-js/faker`](https://fakerjs.dev/) to generate dynamic, randomized test data (names, emails, hex codes, UUIDs) during test execution, rather than using hardcoded static values like `"TestUser"` or `"#ff0000"`.

#### Why it matters

- **Discovers Edge Cases naturally** — Static data like `"John"` never breaks anything. But `faker.person.lastName()` might eventually generate `"O'Connor"`, exposing an unescaped SQL query or a UI component that doesn't handle apostrophes correctly.
- **Prevents State Collisions** — Hardcoded entities (e.g., `email: "test@example.com"`) often conflict in parallel test executions or dirty databases. Random data guarantees uniqueness (`faker.internet.email()`), allowing tests to run safely in parallel without stomping on each other's state.
- **Avoids Test Coupling** — Tests shouldn't pass just because they rely on a specific hardcoded shape in the database. Dynamic data forces the test to assert on *system behavior* rather than predefined constants.

#### How to implement

**Step 1:** Install faker:
```bash
npm install -D @faker-js/faker
```

**Step 2:** Generate the data in your test and inject it into the system:

```typescript
import { test, expect } from "../baseFixtures";
import { faker } from "@faker-js/faker";

test("should handle randomized color generation", async ({ page, request }) => {
  // Generate random data
  const randomColorName = `e2e_random_${faker.word.adjective()}_${faker.color.human()}`;
  const randomHex = faker.color.rgb();
  
  // Arrange via API
  await request.post("/api/colors", {
    data: { name: randomColorName, hex: randomHex },
  });

  // Act via UI
  await page.goto("/");
  // The system's robustness is tested because it must render 
  // whatever string faker generated, regardless of length or content.
  await page.getByRole("button", { name: `colors.${randomColorName}` }).click();

  // Assert
  await expect(page.locator("text=Current color:")).toContainText(randomHex);
});
```

#### How to verify

```bash
npx playwright test e2e/tests/random-data.spec.ts
```

---

### 17. Static Code Analysis with MegaLinter

**Files:** [`.mega-linter.yml`](/.mega-linter.yml) · [`.github/workflows/ci.yml`](/.github/workflows/ci.yml)

#### What is it?

Static code analysis is the practice of examining source code before it is run to find vulnerabilities, bugs, styling errors, and suspicious constructs. We use **[MegaLinter](https://megalinter.io/)**, an open-source framework that aggregates 100+ linters into a single tool to analyze our whole repository.

#### Why it matters

- **Security & Vulnerabilities** — MegaLinter scans for hardcoded secrets (Secretlint, Gitleaks), Docker misconfigurations (Checkov), and software bill of materials / vulnerabilities (Trivy SBOM).
- **Code Quality** — Enforces consistent formatting (ESLint, Prettier, jsonlint) across all files, preventing bikeshedding in code reviews and ensuring syntactical correctness.
- **Spell Checking** — Automatically checks for typos in the codebase (CSpell, Lychee), making the code look professional.
- **Fail-Fast Feedback** — Catching these errors in the pipeline or locally before testing saves debugging time and prevents dirty code from reaching the main branch.

#### How it works

MegaLinter is configured via `.mega-linter.yml` where we specify which directories to include/exclude and which overlapping or overly noisy linters to disable. It runs automatically in our GitHub Actions pipeline (`.github/workflows/ci.yml`) on every pull request. 

#### How to verify

You can run MegaLinter locally using the official Docker wrapper to quickly lint the entire project before pushing (requires Docker engine to be running):

```bash
npx --yes mega-linter-runner@latest
```

---

## Getting Started

### Prerequisites

- Node.js 16+
- Docker (for visual regression and consistent cross-platform tests)

### Installation

```bash
# Install frontend dependencies
npm install
npx playwright install

# Install backend dependencies
cd server
npm install
cd ..
```

### Running the application

To run the full stack (React frontend + Express backend + MongoDB), use Docker Compose:

```bash
docker compose up -d
```
The React app will be available at `http://localhost:3000` and the API will run on port `5001`. 
> **Note:** We use port `5001` instead of `5000` because macOS Monterey and later reserves port `5000` for its AirPlay Receiver service, which causes an HTTP 403 Forbidden conflict.

### Running tests locally

```bash
# Run all e2e tests (starts dev server automatically)
npx playwright test

# Run a specific test suite
npx playwright test e2e/tests/a11y.spec.ts

# Run in headed mode (see the browser)
npx playwright test --headed

# Run in UI mode (interactive debugging)
npx playwright test --ui

# Run with coverage
npm run coverage

# Run BDD (Cucumber) tests
npm run test:bdd
```

### Project structure

```text
src/
├── locales/
│   ├── el.json                  # Greek translation file
│   ├── en.json                  # English translation file (default)
│   └── es.json                  # Spanish translation file
server/
├── index.js                     # Express API Backend & MongoDB Seed
├── Dockerfile                   # Docker configuration for backend
e2e/
├── features/
│   └── home.feature             # Gherkin BDD scenarios
├── pages/
│   └── HomePage.ts              # Page Object Model
├── tests/
│   ├── a11y.spec.ts             # Accessibility testing (with i18n support)
│   ├── api.spec.ts              # API schema validation with Zod
│   ├── bdd.spec.ts              # Step definitions for BDD tests
│   ├── coverage.spec.ts         # E2E tests with code coverage
│   ├── cross-browser.spec.ts    # Cross-browser testing strategy
│   ├── data-driven.spec.ts      # Data-driven testing
│   ├── hybrid.spec.ts           # Hybrid E2E testing (API + UI)
│   ├── network-mocking.spec.ts  # Network mocking & interception
│   ├── pom-refactored.spec.ts   # POM demonstration
│   └── visual.spec.ts           # Visual regression & responsive testing
├── snapshots/
│   └── home.png                 # Visual regression baseline
├── baseFixtures.ts              # Istanbul coverage fixture
└── helper.ts                    # Utility functions
```
