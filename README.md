# Test Automation Best Practices in Action

[![Coverage Status](https://coveralls.io/repos/github/jpourdanis/test-automation-best-practices/badge.svg?branch=main)](https://coveralls.io/github/jpourdanis/test-automation-best-practices?branch=main)
[![CI](https://github.com/jpourdanis/test-automation-best-practices/actions/workflows/ci.yml/badge.svg)](https://github.com/jpourdanis/test-automation-best-practices/actions/workflows/ci.yml)

![Demo Animation](demo.webp)

A comprehensive reference project demonstrating **test automation engineering best practices** using [Playwright](https://playwright.dev), [Allure Reports](https://allurereport.org/), [k6](https://k6.io/), and [MegaLinter](https://megalinter.io/). This repository goes beyond simple end-to-end tests to showcase the patterns, architectures, and strategies that make a test suite **robust, maintainable, and scalable**.

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
  - [Part 3: CI/CD & Execution Strategy](#part-3-cicd--execution-strategy)
    - [12. Test Automation Pyramid: API First](#12-test-automation-pyramid-api-first)
    - [13. Consistent Cross-Platform Testing with Docker](#13-consistent-cross-platform-testing-with-docker)
    - [14. Cross-Browser Testing Strategy](#14-cross-browser-testing-strategy)
    - [15. Parallel Execution & Sharding](#15-parallel-execution--sharding)
    - [16. Nightly Builds & Scheduled Playwright Runs](#16-nightly-builds--scheduled-playwright-runs)
  - [Part 4: Quality Gates & Reporting](#part-4-quality-gates--reporting)
    - [17. Static Code Analysis with MegaLinter](#17-static-code-analysis-with-megalinter)
    - [18. E2E Code Coverage](#18-e2e-code-coverage)
    - [19. Quality Gates & Code Coverage Limits](#19-quality-gates--code-coverage-limits)
    - [20. Allure Reports with Historical Data & Flaky Test Detection](#20-allure-reports-with-historical-data--flaky-test-detection)

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

### Part 1: Core Framework & Test Design

#### 1. Page Object Model (POM)

**Files:** [`e2e/pages/HomePage.ts`](/e2e/pages/HomePage.ts) · [`e2e/baseFixtures.ts`](/e2e/baseFixtures.ts) · [`e2e/tests/pom-refactored.spec.ts`](/e2e/tests/pom-refactored.spec.ts)

#### What is it?

The Page Object Model is a design pattern that creates an abstraction layer between your tests and the page structure. Instead of scattering selectors like `page.locator("header")` across dozens of test files, you define them **once** inside a dedicated class. We take this one step further by **registering page objects as Playwright fixtures**, so every test receives a ready-to-use instance automatically — no manual instantiation needed.

#### Why it matters

- **Maintainability** — When a selector changes (e.g., a button class is renamed), you update it in **one place** instead of every test file that references it.
- **Readability** — Tests read like user stories: `homePage.clickColorButton("Red")` is instantly understandable, even by non-engineers.
- **Reusability** — The same page object is shared across multiple test suites, eliminating duplicated boilerplate.
- **Zero boilerplate** — By registering page objects as fixtures in `baseFixtures.ts`, tests simply destructure `{ homePage }` from the test arguments instead of manually calling `new HomePage(page)` in every `beforeEach`.

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

#### 2. Behavior-Driven Development (BDD) with Cucumber

**Files:** [`e2e/features/home.feature`](/e2e/features/home.feature) · [`e2e/tests/bdd.spec.ts`](/e2e/tests/bdd.spec.ts)

**What is it?**
BDD closes the gap between business stakeholders and QA engineers by expressing tests in plain English using Gherkin syntax. We use `playwright-bdd` to seamlessly compile `.feature` files into native Playwright tests.

#### Why it matters

- **Living Documentation** — Your test artifacts serve as the actual source of truth for product requirements.
- **Improved Collaboration** — Product Managers can review or even write the Gherkin scenarios without needing to understand TypeScript or Playwright APIs.
- **Reusability** — The step definitions (`bdd.spec.ts`) leverage the same Page Object Models used by standard end-to-end tests, maximizing reusability and reducing duplication.

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

#### 3. Avoiding Static Waits with waitForResponse

**File:** [`e2e/tests/visual.spec.ts`](/e2e/tests/visual.spec.ts)

**What is it?**
Using Playwright's `page.waitForResponse()` to synchronise test execution with asynchronous network activity, instead of inserting arbitrary time delays (`page.waitForTimeout`).

#### Why it matters

`page.waitForTimeout(2000)` is the most common anti-pattern in end-to-end testing. It has two failure modes:

- **Too short** — the request hasn't completed yet, so the assertion fails on a fast machine.
- **Too long** — you're wasting seconds on every test run, even when the request resolves in 100ms.

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

#### 4. Data-Driven Testing

**File:** [`e2e/tests/data-driven.spec.ts`](/e2e/tests/data-driven.spec.ts)

#### What is it?

A pattern where a single test template is executed multiple times with different input data. Instead of writing three nearly identical tests for three colors, you define the data once and generate the tests programmatically.

#### Why it matters

- **DRY (Don't Repeat Yourself)** — The test logic is written once. Adding a new test case means adding one line to the data array, not copying an entire test block.
- **Scalability** — When your application adds a fourth or fifth color, you add one object to the array and get full test coverage instantly.
- **Consistency** — Every data point goes through the exact same assertion pipeline, eliminating the risk of copy-paste bugs in duplicated test blocks.

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

#### 5. Random Data Generation with faker.js

**File:** [`e2e/tests/random-data.spec.ts`](/e2e/tests/random-data.spec.ts)

#### What is it?

Using a library like [`@faker-js/faker`](https://fakerjs.dev/) to generate dynamic, randomized test data (names, emails, hex codes, UUIDs) during test execution, rather than using hardcoded static values like `"TestUser"` or `"#ff0000"`.

#### Why it matters

- **Discovers Edge Cases naturally** — Static data like `"John"` never breaks anything. But `faker.person.lastName()` might eventually generate `"O'Connor"`, exposing an unescaped SQL query or a UI component that doesn't handle apostrophes correctly.
- **Prevents State Collisions** — Hardcoded entities (e.g., `email: "test@example.com"`) often conflict in parallel test executions or dirty databases. Random data guarantees uniqueness (`faker.internet.email()`), allowing tests to run safely in parallel without stomping on each other's state.
- **Avoids Test Coupling** — Tests shouldn't pass just because they rely on a specific hardcoded shape in the database. Dynamic data forces the test to assert on _system behavior_ rather than predefined constants.

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

### Part 2: Comprehensive Test Coverage

#### 6. Hybrid E2E Testing

**File:** [`e2e/tests/hybrid.spec.ts`](/e2e/tests/hybrid.spec.ts)

#### What is it?

A hybrid test leverages both backend API calls and frontend UI interactions in a single test case. Instead of clicking through the UI to create a resource or set up a specific state, the test uses the `request` fixture to interact directly with the API to set the system under test to the desired state. It then navigates to the UI to verify the required behavior.

#### Why it matters

- **Unmatched Speed** — Setting up test state via the UI involves waiting for pages to load, animations to finish, and multiple clicks to register. API setup takes milliseconds.
- **Improved Reliability (Less Flake)** — The UI layer is inherently brittle. Bypassing the UI for the "arrange" phase of a test drastically reduces false negatives caused by UI flakiness in parts of the application that are not the primary focus of the test.
- **True Isolation** — You can create and delete exact data permutations for the specific test without relying on existing database fixtures.

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

#### 7. Network Mocking & Interception

**Files:** [`e2e/tests/network-mocking.spec.ts`](https://www.google.com/search?q=/e2e/tests/network-mocking.spec.ts) · [`e2e/tests/error-handling.spec.ts`](https://www.google.com/search?q=/e2e/tests/error-handling.spec.ts)

#### What is it?

Playwright's `page.route()` API allows you to intercept any network request and either **abort** it (simulating a failure) or **fulfill** it with custom data (mocking an API response).

#### Why it matters

- **Test isolation** — Tests don't depend on live APIs, databases, or third-party services. They run fast and never flake due to network issues.
- **Edge case coverage** — You can simulate states that are difficult to reproduce naturally: API errors, empty responses, rate limits, or missing assets.
- **Speed** — Mocked responses return instantly, dramatically reducing test execution time for API-heavy applications.

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

test("should gracefully handle a color not found in the database", async ({
  page,
}) => {
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
  await expect(homePage.header).toHaveCSS(
    "background-color",
    "rgb(26, 188, 156)",
  );

  // Use i18n-aware accessible locator for the button
  const redBtn = page.getByRole("button", { name: enTranslations.colors.red });
  await redBtn.click();

  // Background should not have changed since the API returned a 404
  await expect(homePage.header).toHaveCSS(
    "background-color",
    "rgb(26, 188, 156)",
  );
});
```
> **Important:** Always call `page.route()` _before_ the action that triggers the network request (e.g., `page.goto()`).

**Simulating complete network failures to verify UI error states**:

```typescript
test("should handle fetch colors network failure gracefully", async ({
  page,
}) => {
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

#### 8. API Schema Validation with Zod

**Files:** [`server/index.js`](https://www.google.com/search?q=/server/index.js) · [`e2e/tests/api.spec.ts`](https://www.google.com/search?q=/e2e/tests/api.spec.ts)

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

#### 9. Visual Regression & Responsive Testing

**File:** [`e2e/tests/visual.spec.ts`](https://www.google.com/search?q=/e2e/tests/visual.spec.ts)

##### What is it?

Visual regression testing captures a full-page screenshot and compares it pixel-by-pixel against a previously approved baseline image. If there's a difference, the test fails and generates a visual diff highlighting exactly what changed.

##### Why it matters

- **Catches what functional tests miss** — A CSS change that shifts a button 5 pixels to the left won't break any functional assertion, but it will break a visual snapshot.
- **Ideal for static content** — Pages like FAQs, landing pages, or dashboards benefit enormously from visual testing because their layout is their primary "feature."
- **Confidence in refactors** — When refactoring CSS or updating components, visual tests confirm nothing changed unexpectedly.

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

#### 10. Accessibility (a11y) Testing

**File:** [`e2e/tests/a11y.spec.ts`](https://www.google.com/search?q=/e2e/tests/a11y.spec.ts)

#### What is it?

Automated accessibility auditing that scans your rendered DOM against the [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/standards-guidelines/wcag/). We use [`@axe-core/playwright`](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright) — the same engine used by browser DevTools accessibility audits.

### Why it matters

- **Inclusivity** — Ensures the application is usable by individuals with visual, motor, or cognitive disabilities.
- **Legal compliance** — Many jurisdictions require WCAG AA compliance for public-facing web applications.
- **Regression prevention** — A CSS refactor can silently break color contrast ratios. An automated a11y gate catches it before merge.
- **Real bugs found** — In this project, the a11y tests uncovered actual contrast violations (white text on yellow/turquoise backgrounds) and missing semantic landmarks (`<main>`, `<h1>`) that were subsequently fixed.


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

If a violation is found, the output will include the exact rule ID (e.g., `color-contrast`), the failing HTML element, and the specific contrast ratio that failed.

### Handling i18n with Accessibility Locators

**File:** [`e2e/tests/a11y.spec.ts`](/e2e/tests/a11y.spec.ts)

When an application has different languages, most engineers panic because their trusted English text locators would break once they change the testing language.

So they abandon accessibility locators and fallback to the dark ages of DOM manipulation. They start writing locators like this:

🚩 `page.locator('.form-group .btn.btn-primary .submit-btn')`  
🚩 `page.locator('//div[@class="login-container"]/div[2]/form/button')`

This is how flaky pipelines are born, and the confidence in the testing is ruined. A developer adds one extra wrapper `div` for a layout tweak, and your entire test suite breaks.

There is a much cleaner way to handle this in Playwright. Your testing framework just needs a single source of truth. Keep it simple: load the correct language JSON file at runtime (e.g., using an environment variable, test parameters, or straight imports). Then you just pass that dynamic dictionary right back into your resilient Playwright locators:

```typescript
// Example: locating a button dynamically based on the current testing language
await page.getByRole("button", { name: i18nConfig.colors.red }).click();
```

Playwright inserts the correct string automatically. English, French, Spanish, or whatsoever — it does not matter. You keep the user-centric accessibility locators and ditch the brittle DOM paths.

Do not compromise your architecture just because the text changes. Smart systems adapt to the context. Adding an additional language to the framework is done under a minute.


**How to verify:**

```bash
npx playwright test e2e/tests/a11y.spec.ts
```

#### 11. Performance Testing with k6

**Files:** [`performance/api-performance.spec.ts`](https://www.google.com/search?q=/performance/api-performance.spec.ts) · [`performance/ui-performance.spec.ts`](https://www.google.com/search?q=/performance/ui-performance.spec.ts)

#### What is it?

Performance testing evaluates how the system behaves under load and measures response times and rendering speeds. We use [k6](https://k6.io/), an open-source load testing tool, to implement two distinct types of performance tests:
- **API Performance Testing**: Simulating hundreds of virtual users (VUs) sending HTTP requests directly to the backend to validate server capacity, throughput, and error rates.
- **UI Performance Testing**: Using the `k6/experimental/browser` module to launch headless Chromium, simulating a single user interacting with the rendered React application to measure frontend rendering time and layout stability.

#### Why it matters

- **Objective Baselines** — Without performance tests, "the app feels slow" is a subjective opinion. k6 provides hard data: "95% of API requests complete in under 500ms."
- **Capacity Planning** — Load tests (ramp-up/hold/ramp-down profiles) reveal exactly when and how the system degrades (e.g., database connection pool exhaustion or Node.js event loop lag).
- **Real User Experience** — Backend API speed doesn't matter if the frontend takes 4 seconds to parse a massive JSON payload and paint the DOM. Browser-based k6 tests measure the *actual* perceived performance from the user's perspective.
- **CI/CD Integration** — Running performance checks in the pipeline prevents "death by a thousand cuts"—small, barely noticeable degradations that accumulate over dozens of PRs until the application is unusable.

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
  const res = http.get('[http://127.0.0.1:5001/api/colors](http://127.0.0.1:5001/api/colors)');
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
    await page.goto('[http://127.0.0.1:3000](http://127.0.0.1:3000)');
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

---

### Part 3: CI/CD & Execution Strategy

#### 12. Test Automation Pyramid: API First

**File:** [`.github/workflows/ci.yml`](https://www.google.com/search?q=/.github/workflows/ci.yml)

#### What is it?

A pipeline execution strategy based on the **Test Automation Pyramid**. It strictly enforces that fast, reliable API test suites must pass before any slower, brittle UI/E2E test suites are executed.

#### Why it matters

- **Fail-Fast Feedback Loop** — If the backend is broken, there is no point in waiting for UI tests to launch, inevitably timeout, and fail. Halting the pipeline immediately saves valuable CI runner minutes.
- **Root Cause Isolation** — When UI tests fail but API tests pass, the regression is definitively isolated to the frontend presentation layer. Conversely, when API tests fail, it highlights a broken backend contract.
- **Cost Efficiency** — End-to-end Playwright tests executing full browser automation are computationally expensive compared to executing raw HTTP requests against API endpoints.

**How to implement:**

In the CI workflow (`.github/workflows/ci.yml`), we declare the API testing step _without_ `continue-on-error`. This instantly fails the workflow if any API endpoints regress. The subsequent E2E steps declare an `if: success()` condition, ensuring they only trigger if the API test step completes flawlessly.

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

#### 13. Consistent Cross-Platform Testing with Docker

**Files:** [`Dockerfile`](https://www.google.com/search?q=/Dockerfile), [`docker-compose.yml`](https://www.google.com/search?q=/docker-compose.yml)

#### What is it?

A Docker-based testing environment that guarantees identical rendering and test behavior across all machines — developer laptops, CI servers, and staging environments.

#### Why it matters

Visual regression tests are particularly sensitive to cross-platform differences. A screenshot taken on **macOS** will differ from one taken on **Linux** due to subtle variations in:

- **Font rendering** — macOS uses Core Text, Linux uses FreeType — same font, different pixels
- **Anti-aliasing** — Sub-pixel smoothing algorithms differ between OSes
- **System fonts** — Default fallback fonts vary across platforms

These differences cause **false positives**: tests pass locally on macOS but fail in Linux-based CI, or vice versa. This erodes trust in the test suite and wastes debugging time.

**How to implement:**

We use Docker with the official [Playwright Docker image](https://hub.docker.com/_/microsoft-playwright) (`mcr.microsoft.com/playwright`) to lock the rendering environment. Our `docker-compose.yml` defines two services:

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
> ```
> 
> 

> # ✅ Replace with plain npm ci
> 
> 
> RUN npm ci --legacy-peer-deps
> 

#### 14. Cross-Browser Testing Strategy

**File:** [`playwright.config.ts`](https://www.google.com/search?q=/playwright.config.ts)

#### What is it?

A conditional strategy for running tests across multiple browser engines (Chromium, Firefox, and WebKit) without permanently inflating the CI execution time for every single commit.

#### Why it matters

Many teams configure Playwright to run every test on all three browsers. While this provides great coverage, it multiplies your test execution time by 3. If a PR takes 15 minutes to run UI tests on Chrome, it will take 45 minutes to run all three browsers. This destroys the developer feedback loop.

The best practice here is **Conditional Execution**:

1. **Pull Requests / Local Dev:** Run tests fast on one primary engine (e.g., Chromium).
2. **Nightly / Release Branches:** Run full regression across all browsers using an environment variable flag.

**How to implement:**

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

#### 15. Parallel Execution & Sharding

**Files:** [`.github/workflows/ci.yml`](https://www.google.com/search?q=/.github/workflows/ci.yml) · [`playwright.config.ts`](https://www.google.com/search?q=/playwright.config.ts)

#### What is it?

Parallel execution runs multiple tests simultaneously on the same machine. Sharding takes this a step further by splitting the entire test suite across multiple identical CI runners (machines), allowing them to execute concurrently and then merging the results back together at the end.

#### Why it matters

- **Massive Time Savings** — As your E2E suite grows, execution time scales linearly. Running 200 tests sequentially could take 30 minutes. By sharding across 4 runners, execution drops to ~8 minutes, restoring the developer feedback loop.
- **Resource Optimization** — Playwright workers max out CPU usage on a single runner. Sharding distributes this computational load across horizontally scaled CI infrastructure.
- **Fail-Fast** — Parallelism and rapid sharding ensure failing tests are identified in a fraction of the time

**How to implement:**

**1. Local/Playwright Parallelism (`playwright.config.ts`):**
We enable `fullyParallel: true` in the Playwright config. This tells Playwright to execute individual tests inside the same file simultaneously using independent worker processes, instead of waiting for file-level boundaries. It effectively parallelizes all tests, including BDD tests, speeding up the execution.

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

#### 16. Nightly Builds & Scheduled Playwright Runs

**File:** [`.github/workflows/ci.yml`](https://www.google.com/search?q=/.github/workflows/ci.yml)

#### What is it?

A scheduled Continuous Integration (CI) run that executes the entire test suite unconditionally at a specific time every day (e.g., midnight), regardless of whether any commits were pushed.

#### Why it matters

- **Cross-Browser Verification** — As discussed in the [Cross-Browser Testing Strategy](#9-cross-browser-testing-strategy), running every test on Firefox, WebKit, and Chrome on every single Pull Request can severely drag down performance. Nightly builds allow you to run the **complete deep-dive matrix** covering all supported platform, OS constraints, and scenarios while the team is asleep.
- **External Dependency Monitoring** — Real-world apps depend on third-party APIs, CDNs, or downstream services that are frequently out of your control. If a third-party gateway changes its response payload silently, a scheduled regression test will report the failure before morning.
- **Flaky Test Identification** — Flaky tests manifest more accurately when tested passively alongside other background systemic disturbances. Finding these via scheduled runs increases confidence during fast-moving days.

**How to implement:**

Using GitHub actions, we configure the `schedule` keyword paired with a standard [cron syntax representation](https://crontab.guru/):

```yaml
on:
  schedule:
    - cron: "0 0 * * *" # Executes daily at Midnight UTC
```

---

### Part 4: Quality Gates & Reporting

#### 17. Static Code Analysis with MegaLinter

**Files:** [`.mega-linter.yml`](https://www.google.com/search?q=/.mega-linter.yml) · [`.github/workflows/ci.yml`](https://www.google.com/search?q=/.github/workflows/ci.yml)

#### What is it?

Static code analysis is the practice of examining source code before it is run to find vulnerabilities, bugs, styling errors, and suspicious constructs. We use **[MegaLinter](https://megalinter.io/)**, an open-source framework that aggregates 100+ linters into a single tool to analyze our whole repository.

#### Why it matters

- **Security & Vulnerabilities** — MegaLinter scans for hardcoded secrets (Secretlint, Gitleaks), Docker misconfigurations (Checkov), and software bill of materials / vulnerabilities (Trivy SBOM).
- **Code Quality** — Enforces consistent formatting (ESLint, Prettier, jsonlint) across all files, preventing bikeshedding in code reviews and ensuring syntactical correctness.
- **Spell Checking** — Automatically checks for typos in the codebase (CSpell, Lychee), making the code look professional.
- **Fail-Fast Feedback** — Catching these errors in the pipeline or locally before testing saves debugging time and prevents dirty code from reaching the main branch.

**How to verify:**

MegaLinter is configured via `.mega-linter.yml` where we specify which directories to include/exclude and which overlapping or overly noisy linters to disable. It runs automatically in our GitHub Actions pipeline (`.github/workflows/ci.yml`) on every pull request.


```bash
npx --yes mega-linter-runner@latest
```

#### 18. E2E Code Coverage

**Files:** [`e2e/baseFixtures.ts`](https://www.google.com/search?q=/e2e/baseFixtures.ts) · [`e2e/tests/coverage.spec.ts`](https://www.google.com/search?q=/e2e/tests/coverage.spec.ts)

#### What is it?

Code coverage measurement for **end-to-end tests**, not just unit tests. Using [Istanbul/nyc](https://github.com/istanbuljs/nyc), we instrument the application at build time and collect coverage data from the browser during Playwright test execution. This tells you exactly which lines, branches, and functions of your source code are exercised by your E2E suite.

#### Why it matters

- **Identifies blind spots** — Shows which parts of your codebase have no E2E test coverage, guiding you on where to write the next test.
- **Measures test effectiveness** — A test suite with 200 tests but 30% coverage has fundamental gaps. Coverage metrics make this visible.
- **CI/CD integration** — Coverage data is uploaded to [Coveralls](https://coveralls.io/) on every push, providing historical trends and PR-level deltas.
- **Stakeholder communication** — Coverage percentages are easy to understand and share with product managers and engineering leads.

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

#### 19. Quality Gates & Code Coverage Limits

**Files:** [`package.json`](https://www.google.com/search?q=/package.json) · [`.github/workflows/ci.yml`](https://www.google.com/search?q=/.github/workflows/ci.yml)

#### What is it?

A strict validation step in the CI pipeline that automatically fails the build if the end-to-end test code coverage falls below a predefined threshold (80%). We use `nyc check-coverage` to enforce this rule during the comprehensive test run.

#### Why it matters

- **Automated Standard Enforcement** — It guarantees that **"nothing will be added to the codebase without tests."** You don't have to argue during code review about missing tests; the pipeline handles it objectively.
- **Prevents Technical Debt** — By enforcing coverage on every Pull Request, the codebase maintains its health continuously instead of requiring massive "test refactoring" sprints later.
- **Confidence in Refactoring** — High, enforced test coverage acts as a safety net, allowing developers to refactor freely with the assurance that they haven't broken existing functionality.

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

#### 20. Allure Reports with Historical Data & Flaky Test Detection

**Link:** [Live Allure Report](https://jpourdanis.github.io/test-automation-best-practices/)

#### What is it?

[Allure Framework](https://allurereport.org/) is a flexible lightweight multi-language test report tool that not only shows a very concise representation of what has been tested in a neat web report form, but allows everyone participating in the development process to extract maximum useful information from everyday execution of tests. We've integrated `allure-playwright` to automatically generate these reports.

#### Why it matters

- **Flaky Test Detection** — Allure identifies flaky tests through two mechanisms:
    - **History Tracking:** Tests that pass and fail intermittently across different runs are automatically flagged.
    - **Automatic Categorization:** Known unstable environments (like network timeouts) can be marked as `flaky` instantly using custom regex patterns in the reporter configuration. This is crucial for maintaining a trustworthy test suite and separating real product bugs from infrastructure noise.
- **Rich Visualizations** — Allure categorizes failures into Product Defects (bugs) and Test Defects (broken tests), providing a clear dashboard for stakeholders to understand the health of the application.
- **Attachments** — Screenshots (like visual regression diffs), videos, and traces collected by Playwright are natively embedded into the Allure report for easy debugging and also k6 reports.
- **BDD Metadata & Tag Mapping** — Automatically maps Gherkin tags (e.g., `@epic`, `@feature`, `@severity`) to Allure's rich metadata. This eliminates the need for manual reporting boilerplate in step definitions and creates a direct link between requirements and test results.
- **Jira Integration** — Tags like `@jira:UI-456` are automatically converted into clickable links in the report, providing seamless navigation to issue tracking.

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

#### BDD Metadata & Tag Mapping

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
        allure.issue(issueId, `https://your-company.atlassian.net/browse/${issueId}`);
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
