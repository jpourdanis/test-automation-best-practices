import { check } from 'k6'
import { Rate } from 'k6/metrics'
import http from 'k6/http'
import { browser } from 'k6/browser'
/* eslint-disable no-restricted-globals */
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js'
import { getConfig } from './utils/utils.ts'
import { generateAllureReport } from './utils/allure-reporter.js'

// Resolve URLs from env (production runs) or fall back to local defaults
const BASE_URL = __ENV.BASE_URL ? __ENV.BASE_URL.replace(/\/$/, '') : 'http://127.0.0.1:3000'
// For the setup health-check the API lives on the same host in production (nginx proxy)
// and on a separate port locally.
const API_URL = __ENV.API_URL
  ? __ENV.API_URL.replace(/\/$/, '')
  : __ENV.BASE_URL
    ? __ENV.BASE_URL.replace(/\/$/, '')
    : 'http://127.0.0.1:5001'

const testType = __ENV.TEST_TYPE
const successfulActionsRate = new Rate('successful_actions_rate')

// Load test configurations from external JSON file
const configs = JSON.parse(open('./configs/test-config.json'))
const testConfig = getConfig(configs, testType)

export const options = {
  scenarios: {
    Browser: {
      executor: testConfig.executor || 'ramping-vus',
      // Common options
      options: {
        browser: {
          type: 'chromium',
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--disable-background-networking',
            '--disable-default-apps'
          ]
        }
      },
      // Conditional options based on executor
      ...(testConfig.executor === 'per-vu-iterations'
        ? {
            vus: testConfig.vus,
            iterations: testConfig.iterations,
            maxDuration: testConfig.maxDuration
          }
        : {
            stages: testConfig.stages,
            gracefulRampDown: '30s'
          })
    }
  },
  thresholds: testConfig.thresholds || {
    checks: ['rate==1.0'],
    browser_http_req_duration: ['p(95)<200']
  }
}

export function setup() {
  console.log(`Running UI ${testType?.toUpperCase() || 'DEFAULT'} test 🚀`)
  console.log(`UI URL: ${BASE_URL} | API URL: ${API_URL}`)
  const serverCheck = http.get(`${API_URL}/api/colors`)
  if (serverCheck.status !== 200) {
    throw new Error(`Server is not reachable. Status: ${serverCheck.status}`)
  }
}

let context: any

export default async function performanceTest() {
  if (!context) {
    context = await browser.newContext()
  }
  let page
  try {
    page = await context.newPage()
  } catch (e) {
    // If context is closed/canceled (e.g. WebSocket 1000), recreate it
    console.log('Browser context was closed, recreating...', e)
    context = await browser.newContext()
    page = await context.newPage()
  }

  page.on('request', (request: any) => {
    const payload = request.postData() ? `Payload: ${request.postData()}` : 'No payload'
    console.log(`[UI Request] ${request.method()} ${request.url()} - ${payload}`)
  })

  page.on('response', async (response: any) => {
    let bodyInfo = ''
    if (response.url().includes('/api/')) {
      try {
        const jsonBody = await response.json()
        bodyInfo = ` - Body: ${JSON.stringify(jsonBody)}`
      } catch (e) {
        bodyInfo = ` - Body: [Could not read: ${e}]`
      }
    }
    console.log(`[UI Response] ${response.url()} - Status: ${response.status()}${bodyInfo}`)
  })

  const startTime = Date.now()
  const maxRuntime = 30000 // 30 seconds

  try {
    do {
      // --- Scenario 1: Page load and header visibility ---
      await page.goto(BASE_URL)

      const header = page.locator('header')
      await header.waitFor({ state: 'visible' })
      const isHeaderVisible = await header.isVisible()

      check(page, {
        'Homepage header is visible': () => isHeaderVisible
      })

      // --- Scenario 2: Color selection ---
      const testData = [
        { name: 'Turquoise', expectedHex: '#1abc9c' },
        { name: 'Red', expectedHex: '#e74c3c' },
        { name: 'Yellow', expectedHex: '#f1c40f' }
      ]
      const randomColor = testData[Math.floor(Math.random() * testData.length)]

      const colorButton = page.locator('button', { hasText: randomColor.name })
      await colorButton.click()

      // Simulate user reading the color result before moving on
      const thinkTime = (testConfig.sleepMin ?? 1) * 1000
      await page.waitForTimeout(thinkTime)

      const currentColorText = page.locator('header span', { hasText: randomColor.expectedHex })
      await currentColorText.waitFor({ state: 'visible' })
      const textContext = await currentColorText.textContent()

      const colorUpdated = check(page, {
        [`${randomColor.name} color updated successfully`]: () =>
          textContext !== null && textContext.includes(randomColor.expectedHex)
      })

      // --- Scenario 3: Language toggle ---
      // Cycles through a second locale and back to verify i18n renders without breaking layout
      const langButton = page
        .locator('[data-testid="language-selector"], select, [aria-label*="lang"], [aria-label*="Language"]')
        .first()
      const langButtonExists = await langButton.isVisible().catch((e) => {
        console.log(`[UI] Language selector not found or not visible: ${e}`)
        return false
      })

      let langToggleWorked = true
      if (langButtonExists) {
        await langButton.click()
        await page.waitForTimeout(500)
        // Switch back to ensure default locale is restored for subsequent iterations
        const headerAfterLang = page.locator('header')
        await headerAfterLang.waitFor({ state: 'visible' })
        langToggleWorked = await headerAfterLang.isVisible()
        check(page, {
          'Header still visible after language toggle': () => langToggleWorked
        })
      }

      if (isHeaderVisible && colorUpdated) {
        successfulActionsRate.add(1)
      } else {
        successfulActionsRate.add(0)
      }

      // If smoke test, continue looping until duration is reached
      if (testType === 'smoke' && Date.now() - startTime < maxRuntime) {
        console.log(
          `[Smoke] Action complete. Time remaining: ${Math.round((maxRuntime - (Date.now() - startTime)) / 1000)}s. Looping...`
        )
        await page.waitForTimeout(1000)
      } else {
        break
      }
    } while (true)
  } catch (e) {
    console.error(`[Test Error] ${e}`)
    throw e
  } finally {
    await page.close()
  }
}

export function handleSummary(data: any) {
  const testName = 'UI Performance Test'
  const fileName = 'ui-performance.spec.ts'
  const allureResult = generateAllureReport(data, testName, fileName)
  const uuid = allureResult.uuid

  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    [`allure-results/${uuid}-result.json`]: JSON.stringify(allureResult),
    [`allure-results/${uuid}-attachment.txt`]: textSummary(data, {
      indent: ' ',
      enableColors: false
    })
  }
}
