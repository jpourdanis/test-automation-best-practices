import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';
import { getConfig, getRandomNumber } from './utils/utils.ts';
import { generateAllureReport } from './utils/allure-reporter.js';

const API_URL = 'http://127.0.0.1:5001';
const successfulActionsRate = new Rate('successful_actions_rate');
const successfulActionsCount = new Counter('successful_actions_count');

// Load test configurations from external JSON file
const configs = JSON.parse(open('./configs/test-config.json'));
const testType = __ENV.TEST_TYPE;
const testConfig = getConfig(configs, testType);

export const options = {
    stages: testConfig.stages,
    thresholds: testConfig.thresholds
};

export function setup() {
    console.log(`Running API ${testType?.toUpperCase() || 'DEFAULT'} test 🚀`);
    const serverCheck = http.get(`${API_URL}/api/colors`);
    if (serverCheck.status !== 200) {
        throw new Error(`Server is not reachable. Status: ${serverCheck.status}`);
    }
}

export default function () {
    const newColorName = `PerfColor_${Math.random().toString(36).substring(7)}`;
    const newColorHex = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;

    const colorPayload = JSON.stringify({
        name: newColorName,
        hex: newColorHex,
    });

    const requestParams = {
        headers: {
            'Content-Type': 'application/json',
        }
    };

    group('Color Management', function () {
        // Create a new color
        const createResponse = http.post(`${API_URL}/api/colors`, colorPayload, requestParams);
        const colorCreated = check(createResponse, {
            'Color creation status is 201': (r) => r.status === 201
        });

        if (colorCreated) {
            successfulActionsRate.add(1);
            successfulActionsCount.add(1);

            // Read the color back
            const getResponse = http.get(`${API_URL}/api/colors/${newColorName}`);
            check(getResponse, {
                'Retrieve color status is 200': (r) => r.status === 200,
                'Retrieved correct hex': (r) => r.json('hex') === newColorHex
            });

            // Cleanup via Delete
            http.del(`${API_URL}/api/colors/${newColorName}`);
        } else {
            successfulActionsRate.add(0);
        }
    });

    sleep(getRandomNumber(1, 3));
}

export function handleSummary(data: any) {
    const testName = 'API Performance Test';
    const fileName = 'api-performance.spec.ts';
    const allureResult = generateAllureReport(data, testName, fileName);
    const uuid = allureResult.uuid;

    return {
        'stdout': textSummary(data, { indent: ' ', enableColors: true }),
        [`allure-results/${uuid}-result.json`]: JSON.stringify(allureResult),
        [`allure-results/${uuid}-attachment.txt`]: textSummary(data, { indent: ' ', enableColors: false }),
    };
}
