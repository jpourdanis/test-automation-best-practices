# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack reference project for modern test automation best practices. It combines a React color-picker frontend, an Express/MongoDB backend, and a comprehensive test suite covering E2E, unit, BDD, visual regression, performance, accessibility, and security scanning.

**Three-tier architecture:**

```
React 19 (port 3000)  ←→  Express 5 (port 5001)  ←→  MongoDB (port 27017)
```

The normal dev/test flow runs everything via Docker Compose.

## Commands

### Development

```bash
npm start              # React dev server (port 3000, requires backend separately)
docker compose up      # Full stack: mongo + api + web
```

### Building

```bash
npm run build          # Production build with Istanbul coverage instrumentation
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
```

Run a single Playwright test file:

```bash
npx playwright test e2e/tests/pom.spec.ts
```

Run a single Jest test file:

```bash
npx jest src/App.test.tsx --coverage
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
npm run security:audit         # npm audit
npm run security:scan:code     # Trivy code scan
npm run snyk:test              # Snyk dependency scan
```

## Architecture

### Frontend (`src/`)

- React 19 + TypeScript color-picker app
- i18n via i18next (English, Spanish, Greek) — locale files in `src/locales/`
- Built with react-app-rewired + config-overrides.js (Babel Istanbul plugin for coverage)
- Unit tests co-located as `*.test.tsx/ts`

### Backend (`server/`)

- Express 5 REST API with Mongoose/MongoDB
- Zod for schema validation, Swagger for API docs (`/api-docs`)
- Rate limiting via express-rate-limit
- Jest unit tests (`*.test.js`) and integration tests (`*.int.test.js`) using Testcontainers (real MongoDB)

### E2E Tests (`e2e/`)

- `pages/` — Page Object Model (HomePage.ts)
- `tests/` — 14 test suites: POM, BDD, API, visual, a11y, coverage, hybrid, error handling, network mocking, random data, cross-browser
- `features/` — Gherkin BDD scenarios (`home.feature`)
- `fixtures/` — Custom Playwright fixtures
- `baseFixtures.ts` — Core fixture wrapping coverage collection, logging, Allure BDD mapper
- `global-setup.ts` — Global initialization

### Performance Tests (`performance/`)

- k6 scripts for API and UI smoke/load testing

### Playwright Configuration (`playwright.config.ts`)

- WebServer: auto-starts `docker-compose up` (reuses if already running)
- Projects: Chrome (default), BDD (playwright-bdd), Firefox/Safari (cross-browser mode)
- Reporters: Allure (with flaky detection) + HTML + list
- Retries: 2 in CI, 0 locally; `fullyParallel: true`
- Snapshots stored in `e2e/snapshots/`

### Docker Compose

Four services: `mongo` → `api` → `web` → `playwright`. The `playwright` service runs tests against the full stack. The `web` service uses Nginx to serve the React build and reverse-proxy API calls.

### CI/CD (`.github/workflows/`)

GitHub Actions pipeline with: MegaLinter, SonarCloud, Snyk, Trivy, Allure report publishing, and all test suites.

## Key Configuration Files

| File                       | Purpose                                               |
| -------------------------- | ----------------------------------------------------- |
| `playwright.config.ts`     | Playwright projects, reporters, webServer             |
| `docker-compose.yml`       | Full stack orchestration                              |
| `config-overrides.js`      | react-app-rewired (Istanbul instrumentation)          |
| `sonar-project.properties` | SonarCloud analysis config                            |
| `stryker.conf.json`        | Mutation testing (70% break threshold)                |
| `.prettierrc`              | `semi: false`, `singleQuote: true`, `printWidth: 120` |
| `nginx.conf`               | Nginx reverse proxy for frontend container            |

## Environment Variables

Stored in `.env.local` (not committed). Required variables:

- `MONGODB_URI` — MongoDB Atlas connection string
- `SONAR_TOKEN` — SonarCloud token
- `SNYK_TOKEN` — Snyk API token
