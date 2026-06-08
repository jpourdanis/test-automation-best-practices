const path = require('path')
const fs = require('fs')
// jest-environment-node@30 is nested inside jest-runner when npm workspaces hoist
// jest@29 to root, leaving @30 un-hoisted. Use the absolute path so both jest
// and Stryker's require.resolve find the correct version regardless of hoisting.
const jestRunnerDir = path.dirname(require.resolve('jest-runner/package.json'))
const nestedEnvNode = path.join(jestRunnerDir, 'node_modules', 'jest-environment-node')
const testEnvironment = fs.existsSync(path.join(nestedEnvNode, 'package.json')) ? nestedEnvNode : 'node'

module.exports = {
  testEnvironment,
  testMatch: ['**/*.test.js'],
  testPathIgnorePatterns: process.env.TESTCONTAINERS_RYUK_DISABLED ? [] : ['\\.int\\.test\\.js$'],
  testTimeout: 30000,
  collectCoverage: true,
  collectCoverageFrom: ['index.js'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json', 'clover'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'allure-results',
        outputName: 'junit-unit-tests.xml',
        suiteName: 'Server Unit Tests (Mutation Testing Baseline)'
      }
    ]
  ]
}
