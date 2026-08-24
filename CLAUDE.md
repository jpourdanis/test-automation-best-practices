# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack reference project for modern test automation best practices. It combines a React color-picker frontend, an Express/MongoDB backend, a React Native mobile app, and a comprehensive test suite covering E2E, unit, BDD, visual regression, performance, accessibility, security scanning, and mobile testing.

**Three-tier architecture:**

```
React 19 (port 3000)  ←→  Express 5 (port 5001)  ←→  MongoDB (port 27017)
```

**Monorepo structure (npm workspaces):**

```
packages/shared   # Shared Zod schemas, types, locales, generated API client
server/           # Express backend workspace
mobile/           # React Native workspace
```

The normal dev/test flow runs everything via Docker Compose.

## Context Tooling (lean-ctx)

ALWAYS prefer the `ctx_*` MCP tools over native equivalents when they are listed in this
session — this is a hard requirement, not a soft preference. Load deferred `ctx_*` tools
via ToolSearch proactively at the start of any exploration/search/shell task rather than
defaulting to native Read/Grep/Bash/Glob first.

- `ctx_read` instead of `Read` / `cat` for exploration
- `ctx_shell` instead of `bash` / `Shell`
- `ctx_search` instead of `Grep` / `rg`
- `ctx_tree` instead of `ls` / `find`
- Edits: `ctx_read(mode="anchored")` → `ctx_patch`. `ctx_edit` (str_replace) is the legacy fallback.

Native `Read` → `Edit`/`StrReplace` stays fully supported. Write, Delete, Glob — use normally.
If no `ctx_*` tools are listed in this session, use the native tools throughout.

## Commands

### Development

```bash
npm start              # React dev server (port 3000, requires backend separately)
docker compose up      # Full stack: mongo + api + web
```

### Building

```bash
npm run build          # Production build with Istanbul coverage instrumentation
npm run build:shared   # Build the shared package (auto-run via prebuild)
```

### Linting & Formatting

```bash
npm run lint           # ESLint + Prettier check
npm run lint:fix       # Auto-fix lint issues
npm run format         # Prettier format
```

### Testing

```bash
npm test                          # Playwright E2E (excludes visual specs)
npm run test:unit                 # Jest unit tests (React + server)
npm run test:bdd                  # Cucumber/BDD scenarios
npm run test:cross-browser        # Chrome + Firefox + Safari
npm run test:api                  # API schema validation
npm run test:e2e:docker           # Visual regression (Docker-isolated)
npm run test:e2e:docker:update    # Update visual snapshots
npm run test:visual:percy         # Visual regression via Percy (requires PERCY_TOKEN)
npm run test:browserstack         # Cross-browser cloud testing via BrowserStack
npm run test:e2e:prod             # E2E against production build
```

Run a single Playwright test file:

```bash
npx playwright test e2e/tests/pom-refactored.spec.ts
```

Run a single Jest test file:

```bash
npx jest src/App.test.tsx --coverage
```

### Mobile Testing

```bash
# Run from mobile/ directory
npm run test:e2e:ios       # WebdriverIO + Appium on iOS
npm run test:e2e:android   # WebdriverIO + Appium on Android
```

### Performance Testing

```bash
npm run test:perf:api:smoke   # k6 API smoke test
npm run test:perf:api:load    # k6 API load test
npm run test:perf:ui:smoke    # k6 UI smoke test
npm run test:perf:ui:load     # k6 UI load test
```

### Coverage & Quality

```bash
npm run coverage               # NYC coverage report
npm run coverage:check         # Enforce 80% threshold
npm run sonar:scan             # SonarCloud analysis
npm run mutation:frontend      # Stryker mutation testing (70% break threshold)
```

### Security

```bash
npm run security:audit                  # npm audit
npm run security:scan:code              # Trivy code scan
npm run security:scan:container:app     # Trivy container scan (web)
npm run security:scan:container:api     # Trivy container scan (api)
npm run security:scan                   # All security scans combined
```

### OpenAPI / Code Generation

```bash
npm run generate:openapi   # Generate openapi.json from server JSDoc
npm run generate:client    # Generate TypeScript API client from OpenAPI spec
```

## Architecture

### Shared Package (`packages/shared/`)

- TypeScript-first package built with tsup
- Exports Zod schemas, shared types, and a generated API client
- Locales (EN/ES/EL) consumed by both frontend and mobile — `packages/shared/locales/`
- `generate:client` regenerates the API client from `server/openapi.json`

### Frontend (`src/`)

- React 19 + TypeScript color-picker app: `App.tsx`, `ColorPicker.tsx`, `ConfirmDialog.tsx`
- i18n via i18next (English, Spanish, Greek) — locale source files in `packages/shared/locales/`
- Built with react-app-rewired + `config-overrides.js` (Babel Istanbul plugin for coverage)
- Unit tests co-located as `*.test.tsx/ts`
- `src/__mocks__/@vercel/` — mock stubs for Vercel analytics/speed-insights

### Backend (`server/`)

- Express 5 REST API with Mongoose/MongoDB
- Zod for schema validation (schemas shared via `@color-app/shared`), Swagger for API docs (`/api-docs`)
- Rate limiting via express-rate-limit
- Jest unit tests (`*.test.js`) and integration tests (`*.int.test.js`) using Testcontainers (real MongoDB)
- `scripts/generate-openapi.js` — generates `openapi.json` for client generation

### Mobile App (`mobile/`)

- React Native 0.81 + Expo 54
- i18n support (EN/ES/EL) using shared locales
- E2E testing: WebdriverIO 9 + Appium 3 (XCUITest for iOS, UiAutomator2 for Android)
- Config files: `wdio.ios.conf.ts`, `wdio.android.conf.ts`
- Cloud builds via EAS (Expo Application Services)

### E2E Tests (`e2e/`)

- `pages/` — Page Object Model (`HomePage.ts`)
- `tests/` — 14 test suites:
  - `pom-refactored.spec.ts` — Page Object Model
  - `color-management.spec.ts` — color picker core functionality
  - `bdd.spec.ts` — BDD/Cucumber steps
  - `api.spec.ts` — API schema validation
  - `visual.spec.ts` — visual regression (Docker snapshots)
  - `a11y.spec.ts` — accessibility (axe-core)
  - `coverage.spec.ts` — E2E coverage collection
  - `hybrid.spec.ts` — API setup + UI verification
  - `error-handling.spec.ts` — error scenarios
  - `network-mocking.spec.ts` — request/response mocking
  - `random-data.spec.ts` — Faker-based testing
  - `data-driven.spec.ts` — parameterized tests
  - `security.spec.ts` — security checks
  - `cross-browser.spec.ts` — multi-browser
- `features/` — Gherkin BDD scenarios: `home.feature`, `error-handling.feature`, `i18n.feature`
- `baseFixtures.ts` — core fixture wrapping coverage collection, logging, Allure BDD mapper
- `helper.ts` — shared test utilities
- `global-setup.ts` — global initialization
- `snapshots/` — visual regression baselines (desktop, tablet, mobile breakpoints)

### Performance Tests (`performance/`)

- k6 scripts for API and UI smoke/load testing
- `configs/test-config.json` — shared performance thresholds
- `utils/` — shared k6 utilities
- `k6-remotes.d.ts` — TypeScript type definitions for k6

### Playwright Configuration (`playwright.config.ts`)

- WebServer: auto-starts `docker-compose up` (port 3000, 120s timeout, reuses if running)
- **Projects:**
  - **Chrome** (default) — excludes BDD tests; remote debugging for coverage collection
  - **BDD** (playwright-bdd) — runs `e2e/features/*.feature` via `e2e/tests/bdd.spec.ts`
  - **Firefox/Safari** — cross-browser mode (when `CROSS_BROWSER=true`)
  - **Percy** — visual regression (when `PERCY_TOKEN` set), runs `visual.spec.ts` only
  - **BrowserStack** — 5 configs: Chrome/Firefox/Safari Win11, Pixel 7, iPhone 15 (when `BROWSERSTACK=true`)
- Reporters: Allure (with flaky detection categories) + HTML + list
- Retries: 2 in CI/BrowserStack, 0 locally; `fullyParallel: true`
- Snapshots stored in `e2e/snapshots/`
- Video + trace: retain-on-failure

### Docker Compose

Four services: `mongo` → `api` → `web` → `playwright`. The `playwright` service runs tests against the full stack. The `web` service uses Nginx to serve the React build and reverse-proxy API calls. The `web` build uses `USE_BABEL_PLUGIN_ISTANBUL=1` for E2E coverage; `.nyc_output` is mounted as a volume.

### CI/CD (`.github/workflows/`)

Six workflow files:

| Workflow                    | Purpose                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------ |
| `ci.yml`                    | Main pipeline: MegaLinter, SonarCloud, Jest, E2E, Percy, k6, Trivy, mutation, Allure |
| `release.yml`               | Semantic release (runs after CI success on `main`)                                   |
| `mobile-build.yml`          | iOS/Android builds via EAS                                                           |
| `mobile-e2e.yml`            | Mobile E2E tests with WebdriverIO + Appium                                           |
| `browserstack.yml`          | BrowserStack cloud cross-browser testing                                             |
| `gemini-pipeline-fixer.yml` | CI pipeline maintenance automation                                                   |

## Key Configuration Files

| File                         | Purpose                                               |
| ---------------------------- | ----------------------------------------------------- |
| `playwright.config.ts`       | Playwright projects, reporters, webServer             |
| `docker-compose.yml`         | Full stack orchestration                              |
| `config-overrides.js`        | react-app-rewired (Istanbul instrumentation)          |
| `sonar-project.properties`   | SonarCloud analysis config (sources: src, server)     |
| `stryker.conf.json`          | Frontend mutation testing (70% break threshold)       |
| `server/stryker.config.json` | Backend mutation testing config                       |
| `.prettierrc`                | `semi: false`, `singleQuote: true`, `printWidth: 120` |
| `nginx.conf`                 | Nginx reverse proxy for frontend container            |
| `.releaserc.json`            | Semantic Release: changelog, npm, git, github plugins |
| `.mega-linter.yml`           | MegaLinter config (scoped to src/ and server/)        |
| `.percy.yml`                 | Percy visual regression configuration                 |
| `browserstack.yml`           | BrowserStack tunnel and browser matrix config         |
| `.checkov.yml`               | IaC security scanning (Checkov)                       |
| `.cspell.json`               | Spell checking configuration                          |
| `vercel.json`                | Vercel deployment configuration                       |

## Environment Variables

Stored in `.env.local` (not committed). Required variables:

- `MONGODB_URI` — MongoDB Atlas connection string
- `SONAR_TOKEN` — SonarCloud token
- `PERCY_TOKEN` — Percy visual regression token (enables Percy project in Playwright)
- `BROWSERSTACK_USERNAME` / `BROWSERSTACK_ACCESS_KEY` — BrowserStack credentials (enables BrowserStack project)
- `RESEED_API_TOKEN` — Token for reseeding the database between test runs
