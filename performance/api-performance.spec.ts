import http from 'k6/http'
/* eslint-disable no-restricted-globals */
import { check, group, sleep } from 'k6'
import { Counter, Rate } from 'k6/metrics'
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js'
import { getConfig } from './utils/utils.ts'
import { generateAllureReport } from './utils/allure-reporter.js'

// Resolve API URL from env (production) or fall back to local
const API_URL = __ENV.API_URL ?? 'http://127.0.0.1:5001'

const successfulActionsRate = new Rate('successful_actions_rate')
const successfulActionsCount = new Counter('successful_actions_count')
// Tracks POST /api/colors responses that were rejected by the rate limiter (429)
const rateLimitedRequests = new Counter('rate_limited_requests')

// Load test configurations from external JSON file
const configs = JSON.parse(open('./configs/test-config.json'))
const testType = __ENV.TEST_TYPE
const testConfig = getConfig(configs, testType)

// Support both per-vu-iterations (smoke) and ramping-vus (load) executor shapes.
// maxDuration is a scenario-level option and is NOT valid at the global options level in k6.
export const options =
  testConfig.executor === 'per-vu-iterations'
    ? {
        vus: testConfig.vus,
        iterations: testConfig.iterations,
        thresholds: testConfig.thresholds
      }
    : {
        stages: testConfig.stages,
        thresholds: testConfig.thresholds
      }

export function setup() {
  console.log(`Running API ${testType?.toUpperCase() || 'DEFAULT'} test 🚀`)
  console.log(`API URL: ${API_URL}`)
  const serverCheck = http.get(`${API_URL}/api/colors`)
  if (serverCheck.status !== 200) {
    throw new Error(`Server is not reachable. Status: ${serverCheck.status}`)
  }
}

export default function apiPerformanceTest() {
  const newColorName = 'TestColor ' + Math.random().toString(36).substring(2, 8)
  const newColorHex =
    '#' +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, '0')

  const colorPayload = JSON.stringify({
    name: newColorName,
    hex: newColorHex
  })

  const requestParams = {
    headers: {
      'Content-Type': 'application/json'
    }
  }

  // GET /api/colors is not rate-limited — safe to call every iteration
  group('Catalog Browsing', function () {
    const listResponse = http.get(`${API_URL}/api/colors`)
    console.log(`[API Request] GET ${API_URL}/api/colors - Payload: None`)
    console.log(
      `[API Response] GET ${API_URL}/api/colors - Status: ${listResponse.status} - Body: ${listResponse.body}`
    )
    check(listResponse, {
      'List colors status is 200': (r) => r.status === 200,
      'Response is an array': (r) => Array.isArray(r.json()),
      'Contains at least one color': (r) => (r.json() as any[]).length > 0
    })
  })

  // POST /api/colors is rate-limited: 100 requests per 15 min per IP.
  // The sleep at the end of each iteration keeps per-VU throughput well below that ceiling.
  group('Color Management', function () {
    const createResponse = http.post(`${API_URL}/api/colors`, colorPayload, requestParams)
    console.log(`[API Request] POST ${API_URL}/api/colors - Payload: ${colorPayload}`)
    console.log(
      `[API Response] POST ${API_URL}/api/colors - Status: ${createResponse.status} - Body: ${createResponse.body}`
    )

    if (createResponse.status === 429) {
      rateLimitedRequests.add(1)
      successfulActionsRate.add(0)
      console.warn(
        `[Rate Limit] POST /api/colors was rate-limited (429). Backing off for ${testConfig.sleepMin || 10}s...`
      )
      sleep(testConfig.sleepMin || 10)
      return
    }

    const colorCreated = check(createResponse, {
      'Color creation status is 201': (r) => r.status === 201
    })

    if (colorCreated) {
      successfulActionsRate.add(1)
      successfulActionsCount.add(1)

      // Read the color back
      const getResponse = http.get(`${API_URL}/api/colors/${newColorName}`)
      console.log(`[API Request] GET ${API_URL}/api/colors/${newColorName} - Payload: None`)
      console.log(
        `[API Response] GET ${API_URL}/api/colors/${newColorName} - Status: ${getResponse.status} - Body: ${getResponse.body}`
      )
      check(getResponse, {
        'Retrieve color status is 200': (r) => r.status === 200,
        'Retrieved correct hex': (r) => r.json('hex') === newColorHex
      })

      // Update the hex value — PUT is not rate-limited
      const updatedHex =
        '#' +
        Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, '0')
      const putResponse = http.put(
        `${API_URL}/api/colors/${newColorName}`,
        JSON.stringify({ hex: updatedHex }),
        requestParams
      )
      console.log(
        `[API Request] PUT ${API_URL}/api/colors/${newColorName} - Payload: ${JSON.stringify({ hex: updatedHex })}`
      )
      console.log(
        `[API Response] PUT ${API_URL}/api/colors/${newColorName} - Status: ${putResponse.status} - Body: ${putResponse.body}`
      )
      check(putResponse, {
        'Update color status is 200': (r) => r.status === 200,
        'Updated hex matches': (r) => r.json('hex') === updatedHex
      })

      // Cleanup via Delete
      const delResponse = http.del(`${API_URL}/api/colors/${newColorName}`)
      console.log(`[API Request] DELETE ${API_URL}/api/colors/${newColorName} - Payload: None`)
      console.log(
        `[API Response] DELETE ${API_URL}/api/colors/${newColorName} - Status: ${delResponse.status} - Body: ${delResponse.body}`
      )
      check(delResponse, {
        'Delete color status is 200': (r) => r.status === 200
      })
    } else {
      successfulActionsRate.add(0)
    }
  })

  // Production configs set sleepMin/sleepMax to stay within the 100 POST/15 min rate limit.
  // Local configs leave these undefined, falling back to the original 1–3 s range.
  const sleepMin = testConfig.sleepMin ?? 1
  const sleepMax = testConfig.sleepMax ?? 3
  sleep(sleepMin + Math.random() * (sleepMax - sleepMin))
}

export function handleSummary(data: any) {
  const testName = 'API Performance Test'
  const fileName = 'api-performance.spec.ts'
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
