import http from 'k6/http';
import { check } from 'k6';
import { browser } from 'k6/browser';

// Base URLs
const BASE_URL = 'http://127.0.0.1:3000'; // The app is hosted locally on 3000
const API_URL = 'http://127.0.0.1:5001'; // The API is hosted locally on 5001

const testType = __ENV.TEST_TYPE;

// Test Options
export const options = {
    scenarios: {
        Browser: {
            executor: 'shared-iterations',
            vus: 10,
            iterations: 20,
            options: {
                browser: {
                    type: 'chromium',
                    headless: true
                }
            }
        }
    },
    thresholds: {
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

    try {
        await page.goto(BASE_URL);
        
        // Assert header is visible using native k6 browser locators
        const header = page.locator('header');
        await header.waitFor({ state: 'visible' });
        const isHeaderVisible = await header.isVisible();
        
        check(page, {
            'Homepage header is visible': () => isHeaderVisible
        });

        // Click a color button and verify the change
        const targetColor = 'Yellow';
        
        // Wait for the buttons to be rendered and click the exact one
        const colorButton = page.locator(`button:has-text("${targetColor}")`);
        await colorButton.waitFor({ state: 'visible' });
        await colorButton.click();
        
        // Locate the text element showing the current color hex
        const currentColorText = page.locator('text=Current color:');
        const textContext = await currentColorText.textContent();
        
        // Assert the update propagated
        check(page, {
            'Color updated successfully': () => textContext !== null && textContext.includes('#f1c40f')
        });

    } finally {
        page.close();
    }
}
