import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import * as path from 'path';

/**
 * Security Audit Scanning Suite
 * 
 * This test suite executes `npm audit` on both the frontend and backend 
 * codebases locally using child_process. It captures the JSON outputs, 
 * parses the vulnerability payloads, attaches them seamlessly to the 
 * Playwright (Allure) HTML reports, and forces the E2E test to fail 
 * if any HIGH or CRITICAL issues are discovered.
 */
test.describe('Security Audit Scanning', () => {

  test('Frontend package.json should not have HIGH/CRITICAL vulnerabilities', async ({}, testInfo) => {
    let stdoutData = '';
    try {
      // Execute the native npm audit securely, suppressing non-JSON standard CLI outputs.
      // stdio: 'pipe' ensures stdout/stderr errors are captured internally.
      stdoutData = execSync('npm audit --json', { 
        encoding: 'utf-8', 
        cwd: path.resolve(__dirname, '../../'),
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      // We explicitly extract from the first '{' to circumvent npm logging 
      // warnings (like deprecation notices) mutating the pure JSON format.
      const auditData = JSON.parse(stdoutData.substring(stdoutData.indexOf('{')));
      
      await testInfo.attach('Frontend NPM Audit Report', {
        body: JSON.stringify(auditData, null, 2),
        contentType: 'application/json',
      });
    } catch (e: any) {
      // NOTE: `npm audit` naturally exits with code 1 (throws an error via execSync) 
      // if any vulnerabilities are found, regardless of severity level. 
      // We catch this execution failure and parse the `.stdout` buffer.
      if (e.stdout) {
         let auditData;
         try {
           // Safe JSON extraction to ignore potential npm deprecation warnings
           const jsonStr = e.stdout.substring(e.stdout.indexOf('{'));
           auditData = JSON.parse(jsonStr);
         } catch(parseErr) {
             throw new Error(`Failed to parse npm audit JSON: ${e.stdout}`);
         }
         
         // 1. Attach the JSON audit payload directly to the Test step inside Allure reports
         await testInfo.attach('Frontend NPM Audit Report', {
           body: JSON.stringify(auditData, null, 2),
           contentType: 'application/json',
         });
         
         const metadata = auditData.metadata.vulnerabilities;
         const targetIssues = metadata.high + metadata.critical;
         
         // 2. Explicitly gate the CI build by forcing a strict Jest expectation
         // We tolerate LOW/MODERATE, but block deployments exactly when HIGH/CRITICAL > 0
         expect(targetIssues, `Found ${metadata.high} HIGH and ${metadata.critical} CRITICAL vulnerabilities in the frontend`).toBe(0);
      } else {
         throw e;
      }
    }
  });

  test('Backend server/package.json should not have HIGH/CRITICAL vulnerabilities', async ({}, testInfo) => {
    let stdoutData = '';
    try {
      // Execute npm audit on the server (backend API) repository
      stdoutData = execSync('npm audit --json', { 
        encoding: 'utf-8', 
        cwd: path.resolve(__dirname, '../../server'),
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      const auditData = JSON.parse(stdoutData.substring(stdoutData.indexOf('{')));
      
      // Inject clean results into the reporting layer if 0 vulnerabilities exist
      await testInfo.attach('Backend NPM Audit Report', {
        body: JSON.stringify(auditData, null, 2),
        contentType: 'application/json',
      });
    } catch (e: any) {
      if (e.stdout) {
         let auditData;
         try {
           const jsonStr = e.stdout.substring(e.stdout.indexOf('{'));
           auditData = JSON.parse(jsonStr);
         } catch(parseErr) {
             throw new Error(`Failed to parse npm audit JSON: ${e.stdout}`);
         }
         
         // Ensure subsequent audit reports reach Allure, even if failing
         await testInfo.attach('Backend NPM Audit Report', {
           body: JSON.stringify(auditData, null, 2),
           contentType: 'application/json',
         });
         
         const metadata = auditData.metadata.vulnerabilities;
         const targetIssues = metadata.high + metadata.critical;
         
         // Enforce a zero-tolerance policy for HIGH/CRITICAL issues backend-side
         expect(targetIssues, `Found ${metadata.high} HIGH and ${metadata.critical} CRITICAL vulnerabilities in the backend API`).toBe(0);
      } else {
         throw e;
      }
    }
  });

});
