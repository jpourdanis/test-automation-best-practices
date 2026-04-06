module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
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
