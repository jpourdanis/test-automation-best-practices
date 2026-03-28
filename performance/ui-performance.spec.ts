import { check } from 'k6';
import { Rate } from 'k6/metrics';
import http from 'k6/http';
import { browser } from 'k6/browser';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';
import { getConfig } from './utils/utils.ts';
import { generateAllureReport } from './utils/allure-reporter.js';

// Base URLs
const BASE_URL = 'http://127.0.0.1:3000'; // The app is hosted locally on 3000
const API_URL = 'http://127.0.0.1:5001'; // The API is hosted locally on 5001

const testType = __ENV.TEST_TYPE;
const successfulActionsRate = new Rate('successful_actions_rate');

// Load test configurations from external JSON file
const configs = JSON.parse(open('./configs/test-config.json'));
const testConfig = getConfig(configs, testType);

// Test Options configuring how k6 executes the script and browser
export const options = {
    // Scenarios allow multiple types of tests or traffic patterns in one script
    scenarios: {
        // 'Browser' is a custom name for this scenario
        Browser: {
            // 'ramping-vus' allows using stages from the config
            executor: 'ramping-vus',
            stages: testConfig.stages,
            // Additional options specific to the Browser module
            options: {
                browser: {
                    // Start a Chromium-based browser (currently the only supported type)
                    type: 'chromium',
                    // Run in headless mode (no GUI) for performance and CI compatibility
                    headless: true,
                    // Essential for running headless browsers stably in GitHub Actions
                    args: ['no-sandbox','--disable-setuid-sandbox', 'disable-dev-shm-usage', 'disable-gpu']
                }
            }
        }
    },
    // Thresholds define the pass/fail criteria for the test
    thresholds: testConfig.thresholds || {
        // 'checks' metric: verify that 100% (rate==1.0) of all check() calls pass
        checks: ['rate==1.0']
    }
};

export function setup() {
    console.log(`Running UI ${testType?.toUpperCase() || 'DEFAULT'} test 🚀`);
    const serverCheck = http.get(`${API_URL}/api/colors`);
    if (serverCheck.status !== 200) {
        throw new Error(`Server is not reachable. Status: ${serverCheck.status}`);
    }
}

export default async function () {
    const page = await browser.newPage();

    page.on('request', (request) => {
        const payload = request.postData() ? `Payload: ${request.postData()}` : 'No payload';
        console.log(`[UI Request] ${request.method()} ${request.url()} - ${payload}`);
    });

    page.on('response', async (response) => {
        let bodyInfo = '';
        if (response.url().includes('/api/')) {
            try {
                const jsonBody = await (response as any).json();
                bodyInfo = ` - Body: ${JSON.stringify(jsonBody)}`;
            } catch (e) {
                bodyInfo = ' - Body: [Could not read]';
            }
        }
        console.log(`[UI Response] ${response.url()} - Status: ${response.status()}${bodyInfo}`);
    });

    try {
        await page.goto(BASE_URL);
        
        // Assert header is visible using native k6 browser locators
        const header = page.locator('header');
        await header.waitFor({ state: 'visible' });
        const isHeaderVisible = await header.isVisible();
        
        check(page, {
            'Homepage header is visible': () => isHeaderVisible
        });

        // Click a random color button and verify the change
        const testData = [
            { name: "Turquoise", expectedHex: "#1abc9c" },
            { name: "Red", expectedHex: "#e74c3c" },
            { name: "Yellow", expectedHex: "#f1c40f" },
        ];
        const randomColor = testData[Math.floor(Math.random() * testData.length)];

  
        
        // Wait for the buttons to be rendered and click the randomly selected one
        const colorButton = page.locator('button', { hasText: randomColor.name });
        await colorButton.click();
        await page.waitForTimeout(1000); //Simulate that the user is thinking.
          
        // Locate the text element showing the current color hex and wait for it to update
        const currentColorText = page.locator('header span', { hasText: randomColor.expectedHex });
        await currentColorText.waitFor({ state: 'visible' });
        const textContext = await currentColorText.textContent();

        // Assert the update propagated
        const colorUpdated = check(page, {
            [`${randomColor.name} color updated successfully`]: () => textContext !== null && textContext.includes(randomColor.expectedHex)
        });

        if (isHeaderVisible && colorUpdated) {
            successfulActionsRate.add(1);
        } else {
            successfulActionsRate.add(0);
        }

    } finally {
        page.close();
    }
}

export function handleSummary(data: any) {
    const testName = 'UI Performance Test';
    const fileName = 'ui-performance.spec.ts';
    const allureResult = generateAllureReport(data, testName, fileName);
    const uuid = allureResult.uuid;

    return {
        'stdout': textSummary(data, { indent: ' ', enableColors: true }),
        [`allure-results/${uuid}-result.json`]: JSON.stringify(allureResult),
        [`allure-results/${uuid}-attachment.txt`]: textSummary(data, { indent: ' ', enableColors: false }),
    };
}
