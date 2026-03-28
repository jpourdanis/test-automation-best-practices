# Test Automation Best Practices in Action

[![Coverage Status](https://coveralls.io/repos/github/jpourdanis/test-automation-best-practices/badge.svg?branch=main)](https://coveralls.io/github/jpourdanis/test-automation-best-practices?branch=main)
[![CI](https://github.com/jpourdanis/test-automation-best-practices/actions/workflows/ci.yml/badge.svg)](https://github.com/jpourdanis/test-automation-best-practices/actions/workflows/ci.yml)
[![Passed Tests](https://img.shields.io/badge/dynamic/json?color=success&label=Passed&query=%24.statistic.passed&url=https%3A%2F%2Fjpourdanis.github.io%2Ftest-automation-best-practices%2Fwidgets%2Fsummary.json)](https://jpourdanis.github.io/test-automation-best-practices/)
[![Failed Tests](https://img.shields.io/badge/dynamic/json?color=critical&label=Failed&query=%24.statistic.failed&url=https%3A%2F%2Fjpourdanis.github.io%2Ftest-automation-best-practices%2Fwidgets%2Fsummary.json)](https://jpourdanis.github.io/test-automation-best-practices/)
[![Allure Report](https://img.shields.io/badge/Allure%20Report-View-blue?style=for-the-badge)](https://jpourdanis.github.io/test-automation-best-practices/)

![Demo Animation](demo.webp)

A comprehensive reference project demonstrating **test automation engineering best practices** using [Playwright](https://playwright.dev), [Allure Reports](https://allurereport.org/), [k6](https://k6.io/), [Schemathesis](https://schemathesis.readthedocs.io/en/stable/) and [MegaLinter](https://megalinter.io/). This repository goes beyond simple end-to-end tests to showcase the patterns, architectures, and strategies that make a test suite **robust, maintainable, and scalable**.

## Table of Contents

- [Application Architecture](#application-architecture)
- [Getting Started](#getting-started)
- [Best Practices Implemented](#best-practices-implemented)
  - [Part 1: Core Framework & Test Design](#part-1-core-framework--test-design)
    - [1. Page Object Model (POM)](#1-page-object-model-pom)
    - [2. Behavior-Driven Development (BDD) with Cucumber](#2-behavior-driven-development-bdd-with-cucumber)
    - [3. Avoiding Static Waits with waitForResponse](#3-avoiding-static-waits-with-waitforresponse)
    - [4. Data-Driven Testing](#4-data-driven-testing)
    - [5. Random Data Generation with faker.js](#5-random-data-generation-with-fakerjs)
  - [Part 2: Comprehensive Test Coverage](#part-2-comprehensive-test-coverage)
    - [6. Hybrid E2E Testing](#6-hybrid-e2e-testing)
    - [7. Network Mocking & Interception](#7-network-mocking--interception)
    - [8. API Schema Validation with Zod](#8-api-schema-validation-with-zod)
    - [9. Visual Regression & Responsive Testing](#9-visual-regression--responsive-testing)
    - [10. Accessibility (a11y) Testing](#10-accessibility-a11y-testing)
    - [11. Performance Testing with k6](#11-performance-testing-with-k6)
    - [12. API Property-Based Testing with Schemathesis](#12-api-property-based-testing-with-schemathesis)
  - [Part 3: CI/CD & Execution Strategy](#part-3-cicd--execution-strategy)
    - [13. Test Automation Pyramid: API First](#13-test-automation-pyramid-api-first)
    - [14. Consistent Cross-Platform Testing with Docker](#14-consistent-cross-platform-testing-with-docker)
    - [15. Cross-Browser Testing Strategy](#15-cross-browser-testing-strategy)
    - [16. Parallel Execution & Sharding](#16-parallel-execution--sharding)
    - [17. Nightly Builds & Scheduled Playwright Runs](#17-nightly-builds--scheduled-playwright-runs)
  - [Part 4: Quality Gates & Reporting](#part-4-quality-gates--reporting)
    - [18. Static Code Analysis with MegaLinter](#18-static-code-analysis-with-megalinter)
    - [19. E2E Code Coverage](#19-e2e-code-coverage)
    - [20. Quality Gates & Code Coverage Limits](#20-quality-gates--code-coverage-limits)
    - [21. Allure Reports with Historical Data & Flaky Test Detection](#21-allure-reports-with-historical-data--flaky-test-detection)
    - [22. Mutation Testing with Stryker Mutator](#22-mutation-testing-with-stryker-mutator)

---

## Application Architecture



This project follows a **three-tier architecture** with a clear separation between the frontend, backend, and database layers.

```text
┌──────────────────────────────────────────────────────────────────┐
│                        Docker Compose                            │
│                                                                  │
│  ┌─────────────┐     ┌─────────────────┐     ┌──────────────┐    │
│  │  Frontend   │────▶│   Backend API   │────▶│   MongoDB    │    │
│  │   (React)   │     │   (Express)     │     │  (colorsdb)  │    │
│  │  Port 3000  │     │   Port 5001     │     │  Port 27017  │    │
│  └─────────────┘     └─────────────────┘     └──────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Playwright (test runner) — connects to Frontend on :3000   │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘

```

### Frontend — React (TypeScript)

| Item | Details |
| --- | --- |
| **Location** | [`src/`](/src) |
| **Framework** | React 17 with TypeScript |
| **Entry point** | [`src/App.tsx`](/src/App.tsx) |
| **Internationalization** | `react-i18next` with `i18next-browser-languagedetector` — supports English, Spanish, and Greek via JSON translation files in [`src/locales/`](/src/locales) |
| **Dev server** | `react-app-rewired` on port **3000** (with Istanbul instrumentation via `babel-plugin-istanbul` when `USE_BABEL_PLUGIN_ISTANBUL=1`) |
| **API proxy** | [`src/setupProxy.js`](/src/setupProxy.js) forwards `/api/*` requests to the backend, eliminating CORS issues during development |

**How it works:** On load, the React app fetches available colors from `/api/colors`, renders them as buttons, and updates the header background color when a button is clicked by calling `/api/colors/:name`.

### Backend — Express API (Node.js)

| Item | Details |
| --- | --- |
| **Location** | [`server/`](/server) |
| **Framework** | Express 5 with Mongoose 9 |
| **Entry point** | [`server/index.js`](/server/index.js) |
| **Database** | MongoDB (connection URI configurable via `MONGO_URI` env var) |
| **Validation** | [Zod](https://zod.dev/) schemas for request body validation on `POST` and `PUT` endpoints |
| **API docs** | Swagger UI auto-generated from JSDoc annotations, served at `/api-docs` |
| **Port** | **5001** (configurable via `PORT` env var) |

**Endpoints:**

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/colors` | List all colors |
| `GET` | `/api/colors/:name` | Get a single color by name |
| `POST` | `/api/colors` | Create a new color |
| `PUT` | `/api/colors/:name` | Update an existing color |
| `DELETE` | `/api/colors/:name` | Delete a color |

On startup, the server seeds the database with three default colors (Turquoise, Red, Yellow) to ensure a predictable initial state.

### Docker Compose Orchestration

The [`docker-compose.yml`](/docker-compose.yml) defines four services that wire everything together:

| Service | Image / Build | Purpose |
| --- | --- | --- |
| **mongo** | `mongo:latest` | Database — persists data in a named volume (`mongo_data`) |
| **api** | `./server/Dockerfile` | Backend API — waits for `mongo` to be healthy before starting |
| **app** | `./Dockerfile` (target: `app`) | Frontend dev server — waits for `api` to be healthy, proxies `/api` to `http://api:5001` |
| **playwright** | `./Dockerfile` (target: `playwright`) | Test runner — executes Playwright tests against `http://app:3000` |

---

## Getting Started

### Prerequisites

* Node.js 16+
* Docker (for visual regression and consistent cross-platform tests)

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

### Running tests locally

```bash
# Run all e2e tests (starts dev server automatically)
npx playwright test

# Run a specific test suite
npx playwright test e2e/tests/a11y.spec.ts

# Run in headed mode (see the browser)
npx playwright test --headed

# Run BDD (Cucumber) tests
npm run test:bdd
```

### Project structure

```text
e2e/
├── features/
│   └── home.feature             # Gherkin BDD scenarios
├── pages/
│   └── HomePage.ts              # Page Object Model
├── tests/                       # Playwright E2E test suites
│   ├── a11y.spec.ts             # Accessibility testing (with i18n support)
│   ├── api.spec.ts              # API schema validation with Zod
│   ├── bdd.spec.ts              # Step definitions for BDD tests
│   ├── coverage.spec.ts         # E2E tests with code coverage
│   ├── cross-browser.spec.ts    # Cross-browser testing strategy
│   ├── data-driven.spec.ts      # Data-driven testing
│   ├── error-handling.spec.ts   # Error handling & network failure simulation
│   ├── hybrid.spec.ts           # Hybrid E2E testing (API + UI)
│   ├── network-mocking.spec.ts  # Network mocking & interception
│   ├── pom-refactored.spec.ts   # POM demonstration
│   ├── random-data.spec.ts      # Random data generation with faker.js
│   └── visual.spec.ts           # Visual regression & responsive testing
├── snapshots/
│   ├── home.png                 # Visual regression baseline for desktop
│   └── home-mobile.png          # Visual regression baseline for mobile
├── baseFixtures.ts              # Playwright fixtures (POM, Coverage)
└── helper.ts                    # Utility functions
performance/
├── configs/
│   └── test-config.json         # k6 load test configurations
├── utils/
│   ├── allure-reporter.js       # k6 to Allure results transformer
│   └── utils.ts                 # Performance test utilities
├── api-performance.spec.ts      # k6 API load tests
└── ui-performance.spec.ts       # k6 Browser performance tests
server/
├── index.js                     # Express API Backend & MongoDB Seed
├── index.test.js                # Jest + Supertest unit tests
├── jest.config.js               # Jest configuration
├── stryker.config.json          # Stryker mutation testing configuration
└── Dockerfile                   # Docker configuration for backend
src/
├── locales/                     # i18n translation files (en, es, el)
├── App.tsx                      # Main React application
└── index.tsx                    # Frontend entry point
docker-compose.yml               # Multi-container orchestration
playwright.config.ts             # Playwright configuration
```

---

## Best Practices Implemented

## Part 1: Core Framework & Test Design

### 1. Page Object Model (POM)

**Files:** [`e2e/pages/HomePage.ts`](/e2e/pages/HomePage.ts) · [`e2e/baseFixtures.ts`](/e2e/baseFixtures.ts) · [`e2e/tests/pom-refactored.spec.ts`](/e2e/tests/pom-refactored.spec.ts)

**What is it?**
The Page Object Model is a design pattern that creates an abstraction layer between your tests and the page structure. Instead of scattering selectors like `page.locator("header")` across dozens of test files, you define them **once** inside a dedicated class. We take this one step further by **registering page objects as Playwright fixtures**, so every test receives a ready-to-use instance automatically — no manual instantiation needed.

**Why it matters:**

* **Maintainability** — When a selector changes (e.g., a button class is renamed), you update it in **one place** instead of every test file that references it.
* **Readability** — Tests read like user stories: `homePage.clickColorButton("Red")` is instantly understandable, even by non-engineers.
* **Zero boilerplate** — By registering page objects as fixtures in `baseFixtures.ts`, tests simply destructure `{ homePage }` from the test arguments instead of manually calling `new HomePage(page)` in every `beforeEach`.

**How to implement:**

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

**Step 2:** Register the page object as a fixture in `baseFixtures.ts`:

```typescript
// e2e/baseFixtures.ts
import { test as baseTest } from "@playwright/test";
import { HomePage } from "./pages/HomePage";

export const test = baseTest.extend<{ homePage: HomePage }>({
  // Automatically instantiate Page Objects
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
});
export const expect = test.expect;
```

**Step 3:** Use the fixture in your tests:

```typescript
// e2e/tests/pom-refactored.spec.ts
import { test, expect } from "../baseFixtures";

test.describe("POM Refactored: Background color tests", () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
  });

  test("verify Red (#e74c3c) is applied as the background color", async ({ homePage }) => {
    await homePage.clickColorButton("Red");
    await expect(homePage.currentColorText).toContainText("e74c3c");
  });
});
```

**How to verify:**

```bash
npx playwright test e2e/tests/pom-refactored.spec.ts
```

### 2. Behavior-Driven Development (BDD) with Cucumber

**Files:** [`e2e/features/home.feature`](/e2e/features/home.feature) · [`e2e/tests/bdd.spec.ts`](/e2e/tests/bdd.spec.ts)

**What is it?**
BDD closes the gap between business stakeholders and QA engineers by expressing tests in plain English using Gherkin syntax. We use `playwright-bdd` to seamlessly compile `.feature` files into native Playwright tests.

**Why it matters:**

* **Living Documentation** — Your test artifacts serve as the actual source of truth for product requirements.
* **Improved Collaboration** — Product Managers can review or even write the Gherkin scenarios without needing to understand TypeScript or Playwright APIs.
* **Reusability** — The step definitions (`bdd.spec.ts`) leverage the same Page Object Models used by standard end-to-end tests, maximizing reusability and reducing duplication.

**How to implement:**

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

**How to verify:**

```bash
npm run test:bdd
```

### 3. Avoiding Static Waits with waitForResponse

**File:** [`e2e/tests/visual.spec.ts`](/e2e/tests/visual.spec.ts)

**What is it?**
Using Playwright's `page.waitForResponse()` to synchronise test execution with asynchronous network activity, instead of inserting arbitrary time delays (`page.waitForTimeout`).

**Why it matters:**
`page.waitForTimeout(2000)` is the most common anti-pattern in end-to-end testing. It has two failure modes:

* **Too short** — the request hasn't completed yet, so the assertion fails on a fast machine.
* **Too long** — you're wasting seconds on every test run, even when the request resolves in 100ms.
A slow Docker network or a busy CI runner exaggerates both problems. The test becomes **non-deterministic**: it passes locally and fails in CI for no obvious reason.

**How to implement:**

```typescript
// ❌ Anti-pattern — arbitrary delay, non-deterministic
await homePage.clickColorButton("Yellow");
await page.waitForTimeout(2000); // Hope the API responds within 2s
const hex = await homePage.getCurrentColorText();
expect(hex).toContain("#f1c40f");

// ✅ Best practice — deterministic, no wasted time
// 1. Register the listener BEFORE the click
const responsePromise = page.waitForResponse(
  (resp) => resp.url().includes("/api/colors/Yellow") && resp.status() === 200,
);
// 2. Fire the action
await homePage.clickColorButton("Yellow");
// 3. Await the response (resolves as soon as it arrives)
await responsePromise;
// 4. Use auto-retrying assertion to handle React state update
await expect(homePage.currentColorText).toContainText("#f1c40f");
```

**How to verify:**

```bash
npm run test:e2e:docker
```

### 4. Data-Driven Testing

**File:** [`e2e/tests/data-driven.spec.ts`](/e2e/tests/data-driven.spec.ts)

**What is it?**
A pattern where a single test template is executed multiple times with different input data. Instead of writing three nearly identical tests for three colors, you define the data once and generate the tests programmatically.

**Why it matters:**

* **DRY (Don't Repeat Yourself)** — The test logic is written once. Adding a new test case means adding one line to the data array, not copying an entire test block.
* **Scalability** — When your application adds a fourth or fifth color, you add one object to the array and get full test coverage instantly.
* **Consistency** — Every data point goes through the exact same assertion pipeline, eliminating the risk of copy-paste bugs in duplicated test blocks.

**How to implement:**

**Step 1:** Define the test dataset:

```typescript
const testData = [
  { name: "Turquoise", expectedHex: "#1abc9c", expectedRgb: "rgb(26, 188, 156)" },
  { name: "Red", expectedHex: "#e74c3c", expectedRgb: "rgb(231, 76, 60)" },
  { name: "Yellow", expectedHex: "#f1c40f", expectedRgb: "rgb(241, 196, 15)" },
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

**How to verify:**

```bash
npx playwright test e2e/tests/data-driven.spec.ts
```

### 5. Random Data Generation with faker.js

**File:** [`e2e/tests/random-data.spec.ts`](/e2e/tests/random-data.spec.ts)

**What is it?**
Using a library like [`@faker-js/faker`](https://fakerjs.dev/) to generate dynamic, randomized test data (names, emails, hex codes, UUIDs) during test execution, rather than using hardcoded static values like `"TestUser"` or `"#ff0000"`.

**Why it matters:**

* **Discovers Edge Cases naturally** — Static data like `"John"` never breaks anything. But `faker.person.lastName()` might eventually generate `"O'Connor"`, exposing an unescaped SQL query or a UI component that doesn't handle apostrophes correctly.
* **Prevents State Collisions** — Hardcoded entities (e.g., `email: "test@example.com"`) often conflict in parallel test executions or dirty databases. Random data guarantees uniqueness (`faker.internet.email()`), allowing tests to run safely in parallel without stomping on each other's state.

**How to implement:**

```bash
npm install -D @faker-js/faker
```

```typescript
import { test, expect } from "../baseFixtures";
import { faker } from "@faker-js/faker";

test("should handle randomized color generation", async ({ page, request }) => {
  const randomColorName = `e2e_random_${faker.word.adjective()}_${faker.color.human()}`;
  const randomHex = faker.color.rgb();

  await request.post("/api/colors", {
    data: { name: randomColorName, hex: randomHex },
  });

  await page.goto("/");
  await page.getByRole("button", { name: `colors.${randomColorName}` }).click();

  await expect(page.locator("text=Current color:")).toContainText(randomHex);
});
```

**How to verify:**

```bash
npx playwright test e2e/tests/random-data.spec.ts
```

---

## Part 2: Comprehensive Test Coverage

### 6. Hybrid E2E Testing

**File:** [`e2e/tests/hybrid.spec.ts`](/e2e/tests/hybrid.spec.ts)

**What is it?**
A hybrid test leverages both backend API calls and frontend UI interactions in a single test case. Instead of clicking through the UI to create a resource or set up a specific state, the test uses the `request` fixture to interact directly with the API to set the system under test to the desired state. It then navigates to the UI to verify the required behavior.

**Why it matters:**

* **Unmatched Speed** — Setting up test state via the UI involves waiting for pages to load, animations to finish, and multiple clicks to register. API setup takes milliseconds.
* **Improved Reliability (Less Flake)** — The UI layer is inherently brittle. Bypassing the UI for the "arrange" phase of a test drastically reduces false negatives caused by UI flakiness in parts of the application that are not the primary focus of the test.
* **True Isolation** — You can create and delete exact data permutations for the specific test without relying on existing database fixtures.

**How to implement:**

```typescript
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

### 7. Network Mocking & Interception

**Files:** [`e2e/tests/network-mocking.spec.ts`](/e2e/tests/network-mocking.spec.ts) · [`e2e/tests/error-handling.spec.ts`](/e2e/tests/error-handling.spec.ts)

**What is it?**
Playwright's `page.route()` API allows you to intercept any network request and either **abort** it (simulating a failure) or **fulfill** it with custom data (mocking an API response).

**Why it matters:**

* **Test isolation** — Tests don't depend on live APIs, databases, or third-party services. They run fast and never flake due to network issues.
* **Edge case coverage** — You can simulate states that are difficult to reproduce naturally: API errors, empty responses, rate limits, or missing assets.
* **Speed** — Mocked responses return instantly, dramatically reducing test execution time for API-heavy applications.

**How to implement:**

**Aborting a request** (simulating a missing asset):

```typescript
test("should handle missing image gracefully", async ({ page }) => {
  await page.route("**/logo.svg", (route) => route.abort());
  await page.goto("/");
  const logoImg = page.getByRole("img", { name: "logo" });
  await expect(logoImg).toHaveAttribute("alt", "logo");
});
```

**Mocking data that doesn't exist in the database**:

```typescript
test("should display colors that do not exist in the database", async ({ page }) => {
  await page.route("**/api/colors", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ name: "Magenta", hex: "#ff00ff" }]),
    });
  });
  // ... Rest of test
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

**Simulating complete network failures to verify UI error states**:

```typescript
test("should handle fetch colors network failure gracefully", async ({ page }) => {
  // Abort the initial colors fetch
  await page.route("**/api/colors", (route) => route.abort("failed"));
  await homePage.goto();

  // Verify UI reacts to the empty/failed data state instead of crashing
  await expect(page.locator("text=Loading colors...")).toBeVisible();
});
```

**How to verify:**

```bash
npx playwright test e2e/tests/network-mocking.spec.ts e2e/tests/error-handling.spec.ts
```

### 8. API Schema Validation with Zod

**Files:** [`server/index.js`](/server/index.js) · [`e2e/tests/api.spec.ts`](/e2e/tests/api.spec.ts)

**What is it?**
Schema validation strictly enforces the exact shape, data types, and requirements of JSON payloads. In this architecture, **Zod** is used as a dual-sided contract: the Express server uses it to reject bad incoming requests, and the Playwright API tests use it to ensure the server's outgoing responses haven't malformed.

**Why it matters:**

* **Contract Enforcement** — APIs are contracts. If a backend developer accidentally renames `userId` to `user_id`, the API might still return a 200 OK, but the frontend will crash. Schema validation catches this structural drift instantly.
* **Documentation as Code** — Zod schemas are executable. Unlike Confluence pages that go out of date, the schema actively enforces the rules at runtime, guaranteeing the documentation is always accurate.
* **Shift-Left Testing** — Invalid payloads are caught at the API boundary before they reach the database layer or propagate to the frontend.

**How to implement:**

**Step 1:** Define Zod schemas on the server.

```javascript
// server/index.js
const { z } = require("zod");
const colorZodSchema = z.object({
  name: z.string({ required_error: "name is required" }).trim().min(1),
  hex: z.string({ required_error: "hex is required" }).trim().regex(/^#[0-9A-Fa-f]{6}$/),
});
```

**Step 2:** Use `safeParse` in Express route handlers.

```javascript
app.post("/api/colors", async (req, res) => {
  const parseResult = colorZodSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues[0].message });
  }
  // ...
});
```

**Step 3:** In Playwright tests, parse every API response through the matching schema.

```typescript
// e2e/tests/api.spec.ts
import { z } from "zod";
const ColorSchema = z.object({
  name: z.string(),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

test("should create a new color with valid schema", async ({ request }) => {
  const response = await request.post(`/api/colors`, { data: { name: "Orange", hex: "#ffa500" } });
  const data = await response.json();
  ColorSchema.parse(data); // Throws if response shape is wrong
});
```

**Step 4:** Write explicit negative tests.

```typescript
test("should reject missing name", async ({ request }) => {
  const response = await request.post(`/api/colors`, { data: { hex: "#ffa500" } });
  expect(response.status()).toBe(400);
  const data = await response.json();
  expect(data.error).toBe("name is required");
});
```

**How to verify:**

```bash
npx playwright test e2e/tests/api.spec.ts
```

### 9. Visual Regression & Responsive Testing

**File:** [`e2e/tests/visual.spec.ts`](/e2e/tests/visual.spec.ts)

**What is it?**
Visual regression testing captures a full-page screenshot and compares it pixel-by-pixel against a previously approved baseline image. If there's a difference, the test fails and generates a visual diff highlighting exactly what changed.

**Why it matters:**

* **Catching Silent UI Failures:** Standard functional tests (`expect(button).toBeVisible()`) will pass even if the button has accidentally been styled to have transparent text on a transparent background. Visual tests catch what the DOM hides.
* **Multi-Device Confidence:** By running these visual checks across simulated viewports (Mobile, Tablet, Desktop), you guarantee responsive media queries haven't been broken during refactors.

**How to implement:**

**Visual Regression:**

```typescript
test.describe("Visual Regression", () => {
  test("homepage should match snapshot", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("header");
    const screenshot = await page.screenshot({
      fullPage: true,
      mask: [page.locator(".App-logo")], // Mask animated elements!
    });
    expect(screenshot).toMatchSnapshot("home.png");
  });
});
```

**Responsive Design:**

```typescript
test.describe("Responsive Design Testing", () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test("should render correctly on mobile viewport", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("header")).toBeVisible();
  });
});
```

**How to verify:**

```bash
npx playwright test e2e/tests/visual.spec.ts
```

### 10. Accessibility (a11y) Testing

**File:** [`e2e/tests/a11y.spec.ts`](/e2e/tests/a11y.spec.ts)

**What is it?**
Automated accessibility auditing that scans your rendered DOM against the [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/standards-guidelines/wcag/). We use [`@axe-core/playwright`](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright) and `Google Lighthouse`.

**Why it matters:**

* **Ethical and Legal Compliance:** Ensuring your app is usable by visually or motor-impaired users is critical. Furthermore, many government and enterprise contracts legally mandate strict WCAG AA compliance.
* **Shift-Left Accessibility:** Catching contrast issues or missing `alt` tags in the CI pipeline prevents costly accessibility remediation sprints right before a product launch.

**How to implement:**

```bash
npm install -D @axe-core/playwright
```

```typescript
// e2e/tests/a11y.spec.ts
import AxeBuilder from "@axe-core/playwright";

test("should not have any accessibility issues", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

**Handling i18n with Accessibility Locators**
When testing apps with translations, avoid brittle DOM paths (e.g. `page.locator('.submit-btn')`). Instead, load the correct language JSON file at runtime:

```typescript
// Example: locating a button dynamically based on the current testing language
await page.getByRole("button", { name: i18nConfig.colors.red }).click();
```

**Accessibility Score via Google Lighthouse**

```typescript
import { playAudit } from "playwright-lighthouse";

test("should meet the accessibility threshold using Google Lighthouse", async ({ page }) => {
  await playAudit({
    page: page,
    thresholds: {
      accessibility: 90,
    },
    port: 9222 + (process.env.TEST_WORKER_INDEX ? parseInt(process.env.TEST_WORKER_INDEX) : 0),
  });
});
```

**How to verify:**

```bash
npx playwright test e2e/tests/a11y.spec.ts -g "Lighthouse"
```

### 11. Performance Testing with k6

**Files:** [`performance/api-performance.spec.ts`](/performance/api-performance.spec.ts) · [`performance/ui-performance.spec.ts`](/performance/ui-performance.spec.ts)

**What is it?**
Performance testing evaluates how the system behaves under load. We use [k6](https://k6.io/) to implement two types of tests:

* **API Performance Testing**: Simulating hundreds of virtual users (VUs) sending HTTP requests directly to the backend.
* **UI Performance Testing**: Using the `k6/experimental/browser` module to launch headless Chromium, simulating a user interacting with the rendered React application to measure frontend rendering time.

**Why it matters:**

* **Preventing Outages:** A system that works perfectly for 1 user might crash due to database connection exhaustion at 100 users. Load testing proves your architecture can handle production traffic.
* **Perceived vs. Actual Speed:** The backend API might return data in 20ms, but if the React frontend takes 3 seconds to parse and render a massive DOM, the user experience is poor. Testing both layers provides a holistic performance picture.

**How to implement:**

**API Load Test:**

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5s', target: 10 }, 
    { duration: '10s', target: 10 }, 
    { duration: '5s', target: 0 },   
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
  },
};

export default function () {
  const res = http.get('http://localhost:5001/api/colors');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

**Browser-level UI Test:**

```javascript
import { browser } from 'k6/experimental/browser';
import { check } from 'k6';

export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      options: { browser: { type: 'chromium' } },
    },
  },
};

export default async function () {
  const page = browser.newPage();
  try {
    await page.goto('http://localhost:3000');
    // ... Check UI interactions
  } finally {
    page.close();
  }
}
```

**How to verify locally:**

```bash
npm run test:perf:api:smoke
npm run test:perf:ui:load
```

### 12. API Property-Based Testing with Schemathesis

**Files:** [`server/index.js`](/server/index.js) · [`package.json`](/package.json) · [`.github/workflows/ci.yml`](/.github/workflows/ci.yml)

**What is it?**
Schemathesis is an automated fuzzing tool. Instead of writing manual API tests, you point Schemathesis at your OpenAPI/Swagger specification. It interprets the spec and automatically generates thousands of edge-case requests (null bytes, massive strings, incorrect types) designed to crash the server.

**Why it matters:**

* **Uncovering Unknown Unknowns:** Developers write tests for edge cases they *think* of. Schemathesis tests the edge cases developers *forget*, often exposing unhandled exceptions that would otherwise result in 500 Server Errors in production.

**How to implement:**

**Step 1:** Serve your OpenAPI schema as a JSON endpoint.

```javascript
// server/index.js
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.get('/openapi.json', (req, res) => {
  res.json(swaggerSpec);
});
```

**Step 2:** Define clear schema constraints (patterns, min/max length, required fields).

```javascript
/**
 * @swagger
 * components:
 * schemas:
 * UpdateColor:
 * type: object
 * anyOf:
 * - required: [name]
 * - required: [hex]
 */
```

**How to verify locally:**

```bash
# Run Schemathesis tests via Docker
npm run test:api:schemathesis
```

---

## Part 3: CI/CD & Execution Strategy

### 13. Test Automation Pyramid: API First

**File:** [`.github/workflows/ci.yml`](/.github/workflows/ci.yml)

**What is it?**
A pipeline execution strategy based on the **Test Automation Pyramid**. It strictly enforces that fast, reliable API test suites must pass before any slower, brittle UI/E2E test suites are allowed to start executing.

**Why it matters:**

* **Optimal Feedback Loops:** If the database is down, the API tests will fail in 10 seconds. If you ran UI tests concurrently, you might wait 5 minutes just for them to timeout and tell you the same thing.
* **Isolating the Root Cause:** If API tests pass but UI tests fail, the QA engineer knows definitively that the bug exists purely in the frontend presentation layer, drastically reducing debugging time.

**How to implement:**

In the CI workflow (`.github/workflows/ci.yml`), we declare the API testing step *without* `continue-on-error`. This instantly fails the workflow if any API endpoints regress. The subsequent E2E steps declare an `if: success()` condition, ensuring they only trigger if the API test step completes flawlessly.

```yaml
- name: Run API tests (host Playwright)
  id: api-tests
  run: npm run test:api

- name: Run end-to-end tests (host Playwright)
  id: e2e-tests
  continue-on-error: true
  if: success() # Only triggers if API tests passed
  run: npm test
```

### 14. Consistent Cross-Platform Testing with Docker

**Files:** [`Dockerfile`](/Dockerfile), [`docker-compose.yml`](/docker-compose.yml)

**What is it?**
A Docker-based testing environment that guarantees identical rendering and test behavior across all machines by executing tests inside the official [Playwright Docker image](https://hub.docker.com/_/microsoft-playwright) (`mcr.microsoft.com/playwright`).

**Why it matters:**

* **Solving "Works on My Machine":** Font rendering, sub-pixel anti-aliasing, and system dependencies differ wildly between Windows, macOS, and Linux. This causes visual regression tests to fail randomly across different machines. Docker locks the rendering engine to a single, consistent Linux environment, eliminating false positives entirely.

**How to implement:**

```dockerfile
FROM [mcr.microsoft.com/playwright:v1](https://mcr.microsoft.com/playwright:v1)

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

CMD ["npm", "test"]
```

> [!CAUTION]
> **Local prerequisite — remove BuildKit cache mounts.**
> Before running locally, replace the cache-mount `RUN` lines in both `Dockerfile` and `server/Dockerfile`:
> ```dockerfile
> # ❌ CI-only — remove locally
> RUN --mount=type=cache,target=/root/.npm \
>     npm ci --legacy-peer-deps
> 
> # ✅ Replace with plain npm ci
> 
> RUN npm ci --legacy-peer-deps
> ```

### 15. Cross-Browser Testing Strategy

**File:** [`playwright.config.ts`](/playwright.config.ts)

**What is it?**
A conditional strategy for running tests across multiple browser engines (Chromium, Firefox, and WebKit) without permanently inflating the CI execution time for every single commit.

**Why it matters:**
Many teams configure Playwright to run every test on all three browsers. While this provides great coverage, it multiplies your test execution time by 3. If a PR takes 15 minutes to run UI tests on Chrome, it will take 45 minutes to run all three browsers. This destroys the developer feedback loop.

**How to implement:**

1. **Pull Requests / Local Dev:** Run tests fast on one primary engine (e.g., Chromium).
2. **Nightly / Release Branches:** Run full regression across all browsers using an environment variable flag.

```typescript
  projects: [
    {
      name: "Chrome",
      use: { ...devices["Desktop Chrome"] },
    },
    ...(process.env.CROSS_BROWSER === "true"
      ? [
          { name: "Firefox", use: { ...devices["Desktop Firefox"] } },
          { name: "WebKit",  use: { ...devices["Desktop Safari"] } },
        ]
      : []),
  ],
```

**How to verify:**

```bash
npm run test # Fast (Chromium)
npm run test:cross-browser # Deep coverage (All browsers)
```

### 16. Parallel Execution & Sharding

**Files:** [`.github/workflows/ci.yml`](/.github/workflows/ci.yml) · [`playwright.config.ts`](/playwright.config.ts)

**What is it?**
While parallelism runs multiple tests on a *single* machine's CPU cores, Sharding takes this a step further by splitting the entire test suite into fractions and distributing them across *multiple separate CI runner machines* simultaneously.

**Why it matters:**

* **Horizontal Scalability:** An E2E test suite will inevitably grow until it takes an hour to run on one machine. By sharding across 5 machines, execution drops to 12 minutes. This ensures the CI pipeline remains fast enough to run on every Pull Request, preserving the continuous integration philosophy.

**How to implement:**

**1. Local/Playwright Parallelism (`playwright.config.ts`):**
We enable `fullyParallel: true` in the Playwright config to execute individual tests simultaneously using independent worker processes.

**2. CI Sharding Strategy (`ci.yml`):**
In GitHub Actions, we define a matrix strategy for the `e2e-sharded` job:

```yaml
strategy:
  fail-fast: false
  matrix:
    shardIndex: [1, 2, 3, 4]
    shardTotal: [4]
```
This spawns 4 identical CI runners. Each runner spins up an isolated Docker environment and is passed a specific slice of the test suite via the CLI flag: `--shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}`.

**How to verify:**

```bash
npx playwright test --shard=1/4

```

### 17. Nightly Builds & Scheduled Playwright Runs

**File:** [`.github/workflows/ci.yml`](/.github/workflows/ci.yml)

**What is it?**
A scheduled Continuous Integration (CI) chron-job that executes the entire test suite unconditionally at a specific time every day (e.g., midnight), regardless of whether any commits were pushed.

**Why it matters:**

* **Catching Time/Date Bugs:** Some bugs only trigger at the end of the month or across timezone boundaries. Nightly runs act as a heartbeat monitor.
* **Third-Party Drift:** If a third-party API your app relies on deploys a breaking change silently at 3 AM, your scheduled pipeline will catch the failure, allowing your team to react before users wake up.

**How to implement:**

Using GitHub actions, we configure the `schedule` keyword paired with a standard cron syntax representation:

```yaml
on:
  schedule:
    - cron: "0 0 * * *" # Executes daily at Midnight UTC
```

---

## Part 4: Quality Gates & Reporting

### 18. Static Code Analysis with MegaLinter

**Files:** [`.mega-linter.yml`](/.mega-linter.yml) · [`.github/workflows/ci.yml`](/.github/workflows/ci.yml)

**What is it?**
An automated pipeline step using **[MegaLinter](https://megalinter.io/)** that parses the raw source code against over 100 different linters (ESLint, Prettier, Checkov, Secretlint) before any tests are even run.

**Why it matters:**

* **Security Shift-Left:** It instantly catches developers accidentally committing AWS keys or database passwords to the repository.
* **Cultural Consistency:** It ends subjective arguments in code review about formatting or syntax styles. The linter acts as the objective, automated arbiter of code quality.

**How to verify:**

```bash
npx --yes mega-linter-runner@latest
```

### 19. E2E Code Coverage

**Files:** [`e2e/baseFixtures.ts`](/e2e/baseFixtures.ts) · [`e2e/tests/coverage.spec.ts`](/e2e/tests/coverage.spec.ts)

**What is it?**
Using [Istanbul/nyc](https://github.com/istanbuljs/nyc) to track exactly which lines, branches, and functions of your application source code were executed during the Playwright end-to-end browser tests.

**Why it matters:**

* **Exposing Blind Spots:** You may have 500 UI tests, but if code coverage is only 40%, you have massive gaps in your testing strategy. It objectively highlights which features are completely untested.
* **CI/CD integration** — Coverage data is uploaded to [Coveralls](https://coveralls.io/) on every push, providing historical trends and PR-level deltas.

**How to implement:**

The custom `baseFixtures.ts` extends Playwright's test runner to:

1. **Inject** a `beforeunload` listener that serializes Istanbul's `__coverage__` object
2. **Expose** a `collectIstanbulCoverage` function to the browser context
3. **Collect** coverage data from every open page after each test completes
4. **Write** coverage JSON files to `.nyc_output/` with unique UUIDs

**Step 1:** Ensure your build pipeline includes `babel-plugin-istanbul` (controlled via the `USE_BABEL_PLUGIN_ISTANBUL` env var).

**Step 2:** Import from `baseFixtures` instead of `@playwright/test`:

```typescript
// e2e/tests/coverage.spec.ts
import { test, expect } from "../baseFixtures"; // ← NOT from @playwright/test
```

**How to verify:**

```bash
npm run coverage
```

### 20. Quality Gates & Code Coverage Limits

**Files:** [`package.json`](/package.json) · [`.github/workflows/ci.yml`](/.github/workflows/ci.yml)

**What is it?**
A strict validation step in the CI pipeline (`nyc check-coverage`) that automatically fails the build if the end-to-end test code coverage falls below a predefined threshold (80%).

**Why it matters:**

* **Preventing Technical Debt:** It enforces a zero-tolerance policy for untested code. Developers cannot merge new features unless they also provide the automation tests to cover them, ensuring the repository's health never degrades over time.

**How to implement:**

```json
"scripts": {
  "coverage:check": "nyc check-coverage --lines 80 --functions 80 --branches 80"
}
```

In `ci.yml`, this step runs after the main test execution:

```yaml
- name: Enforce 80% Code Coverage Gate
  run: npm run coverage:check
```

### 21. Allure Reports with Historical Data & Flaky Test Detection

**Link:** [Live Allure Report](https://jpourdanis.github.io/test-automation-best-practices/)

**What is it?**
[Allure Framework](https://allurereport.org/) is a rich, visual reporting dashboard that aggregates test results, maps them to BDD/Jira tickets, embeds video/screenshots of failures, and tracks the historical pass/fail rate of tests over time. We use `allure-playwright` to natively integrate it.

**Why it matters:**

* **Actionable Observability:** A raw terminal output of `Test Failed` is useless to a manager. Allure translates pipeline data into business intelligence, cleanly categorizing failures into "Product Bugs" vs "Test Flakiness".
* **Visual Evidence:** Screenshots (like visual regression diffs), videos, and traces collected by Playwright are natively embedded into the Allure report for easy debugging.

**How to implement:**

```bash
npm install -D allure-playwright
npm install -g allure-commandline
```

```typescript
  // playwright.config.ts
  retries: process.env.CI ? 2 : 0,

  reporter: process.env.CI
    ? [
        [
          "allure-playwright",
          {
            detail: true,
            suiteTitle: false,
            // Automatically mark known random errors as flaky without needing a retry pass
            categories: [
              {
                name: "Flaky Network Issues",
                messageRegex: ".*timeout.*|.*ECONNRESET.*|.*fetch failed.*", 
                matchedStatuses: ["failed", "broken"],
                flaky: true,
              },
            ],
            links: {
              issue: {
                urlTemplate: "[https://your-company.atlassian.net/browse/%s](https://your-company.atlassian.net/browse/%s)",
                nameTemplate: "Jira: %s",
              },
            },
          },
        ],
        ["list"],
        ["html", { open: "never" }],
      ]
    : [
        ["html", { open: "never" }],
        ["allure-playwright"],
        ["list"],
      ],
```

**BDD Metadata & Tag Mapping**
To avoid manual reporting boilerplate, we use an auto-fixture that maps Gherkin tags directly to Allure metadata:

```typescript
// e2e/baseFixtures.ts
export const test = baseTest.extend<{ homePage: HomePage; allureBddMapper: void }>({
  // Auto-fixture that maps Gherkin tags to Allure metadata
  allureBddMapper: [async ({}, use, testInfo) => {
    for (const tag of testInfo.tags) {
      const cleanTag = tag.replace('@', '');
      if (cleanTag.startsWith('epic:')) allure.epic(cleanTag.split(':')[1].replace(/_/g, ' '));
      if (cleanTag.startsWith('feature:')) allure.feature(cleanTag.split(':')[1].replace(/_/g, ' '));
      if (cleanTag.startsWith('story:')) allure.story(cleanTag.split(':')[1].replace(/_/g, ' '));
      if (cleanTag.startsWith('severity:')) allure.severity(cleanTag.split(':')[1]);
      if (cleanTag.startsWith('jira:')) {
        const issueId = cleanTag.split(':')[1];
        allure.issue(issueId); 
      }
    }
    await use();
  }, { auto: true }],
});
```

**Gherkin Implementation:**

```gherkin
@epic:UI_Components
@feature:Theming
Feature: Home Page Background Color

  @story:Background_Color_Customization
  @severity:normal
  @jira:UI-456
  Scenario Outline: Change background color
    ...
```

**How to verify:**

```bash
npx allure serve allure-results
```

### 22. Mutation Testing with Stryker Mutator

**Files:** [`server/index.js`](/server/index.js) · [`server/index.test.js`](/server/index.test.js) · [`server/stryker.config.json`](/server/stryker.config.json) · [`.github/workflows/ci.yml`](/.github/workflows/ci.yml)

**What is it?**
Mutation testing introduces small, deliberate code changes ("mutants") — like replacing `===` with `!==`, flipping `>` to `<`, or swapping `true` for `false` — and then runs your test suite to see if at least one test fails. If a test catches the change and fails, the mutant is **killed**. If all tests still pass despite the bug, the mutant **survives**, proving your assertions are weak. We use [Stryker Mutator](https://stryker-mutator.io/) to automate this analysis.

**Why it matters:**

* **Coverage ≠ Confidence:** A test can execute every line of code (100% line coverage) and still be completely useless if it lacks meaningful assertions. Consider a test that calls `POST /api/colors` but never checks the response status — it would pass even if the endpoint always returned 500.
* **Quantifying Assertion Quality:** The **mutation score** (percentage of killed mutants) measures how well your tests actually *detect bugs*, not just how much code they *touch*. It is the difference between "exercised" and "verified".
* **CI Quality Gate:** We enforce a ≥70% mutation score threshold in CI, separate from the 80% code coverage gate. If the mutation score drops below 70%, the pipeline fails — guaranteeing that new code comes with substantive, bug-detecting tests.

**How to implement:**

**Step 1:** Write unit tests for your application logic using **Jest + Supertest + mongodb-memory-server**:

```javascript
// server/index.test.js
const request = require('supertest')
const { MongoMemoryServer } = require('mongodb-memory-server')
const mongoose = require('mongoose')

let app, seedDatabase, Color, mongoServer

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri())
  const server = require('./index')
  app = server.app
  seedDatabase = server.seedDatabase
  Color = server.Color
})

beforeEach(async () => { await seedDatabase() })

test('returns 409 for a duplicate color name', async () => {
  const res = await request(app)
    .post('/api/colors')
    .send({ name: 'Red', hex: '#ff0000' })
  expect(res.status).toBe(409)         // ← Asserts status code
  expect(res.body.error).toContain('already exists') // ← Asserts message content
})
```

> **Key Insight:** The assertions must be specific. `expect(res.status).toBe(409)` kills the mutant that changes `409` → `200`. `expect(res.body.error).toContain('already exists')` kills the mutant that swaps the error string to an empty string.

**Step 2:** Configure Stryker to use the Jest test runner:

```json
// server/stryker.config.json
{
  "mutate": ["index.js"],
  "testRunner": "jest",
  "reporters": ["clear-text", "html", "progress"],
  "thresholds": {
    "high": 80,
    "low": 70,
    "break": 70
  }
}
```

The `break: 70` setting causes Stryker to return exit code 1 if the mutation score falls below 70%, which fails the CI pipeline.

**Step 3:** Add a dedicated CI job (runs in parallel with other test jobs, no Docker needed):

```yaml
mutation-testing:
  name: Mutation Testing (Stryker)
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 22
    - run: npm ci
      working-directory: server
    - run: npm test
      working-directory: server
    - run: npm run mutation
      working-directory: server
```

**How to verify:**

```bash
# Run the unit tests
cd server && npm test

# Run Stryker mutation testing
cd server && npm run mutation
```

Stryker generates a detailed HTML report showing each mutant, whether it was killed or survived, and links directly to the mutated line of code.