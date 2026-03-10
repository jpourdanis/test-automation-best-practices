/**
 * Helper to convert k6 summary data to Allure-compatible JSON
 * Based on the Allure 2 results format.
 */

export function generateAllureReport(data, testName, fileName) {
    const timestamp = Date.now();
    const uuid = `k6-${timestamp}-${Math.floor(Math.random() * 1000)}`;
    
    // Extract key metrics for the description
    const metrics = data.metrics || {};
    const httpReqDuration = metrics.http_req_duration ? metrics.http_req_duration.values : {};
    const iterations = metrics.iterations ? metrics.iterations.values.count : 0;
    const vus = metrics.vus ? metrics.vus.values.value : 0;
    
    const summaryText = `
Performance Test: ${testName}
File: ${fileName}
Total Iterations: ${iterations}
Max VUs: ${vus}

HTTP Request Duration:
- Avg: ${httpReqDuration.avg ? httpReqDuration.avg.toFixed(2) : 0}ms
- P(95): ${httpReqDuration['p(95)'] ? httpReqDuration['p(95)'].toFixed(2) : 0}ms
- Max: ${httpReqDuration.max ? httpReqDuration.max.toFixed(2) : 0}ms

Full metrics attached in the results.
    `.trim();

    const result = {
        uuid: uuid,
        historyId: `${testName}-${fileName}`,
        status: "passed", // We assume passed if we specify thresholds and they are met
        statusDetails: {},
        stage: "finished",
        steps: [],
        attachments: [
            {
                name: "k6-summary",
                type: "text/plain",
                source: `${uuid}-attachment.txt`
            }
        ],
        parameters: [
            { name: "VUs", value: vus.toString() },
            { name: "Iterations", value: iterations.toString() }
        ],
        labels: [
            { name: "parentSuite", value: "Performance" },
            { name: "suite", value: testName },
            { name: "subSuite", value: fileName },
            { name: "framework", value: "k6" },
            { name: "language", value: "javascript" }
        ],
        name: `${testName}`,
        description: summaryText,
        start: timestamp - (metrics.iteration_duration ? metrics.iteration_duration.values.avg * iterations : 0),
        stop: timestamp
    };

    // Check if any thresholds failed
    const thresholds = data.metrics || {};
    let failed = false;
    Object.keys(thresholds).forEach(key => {
        const metric = thresholds[key];
        if (metric.thresholds) {
            Object.keys(metric.thresholds).forEach(t => {
                if (!metric.thresholds[t].ok) {
                    failed = true;
                }
            });
        }
    });

    if (failed) {
        result.status = "failed";
        result.statusDetails = { message: "One or more performance thresholds failed." };
    }

    return result;
}
