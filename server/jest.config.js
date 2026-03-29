module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/index.test.js'],
  testTimeout: 30000,
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'allure-results',
        outputName: 'junit-unit-tests.xml',
        suiteName: 'Server Unit Tests (Mutation Testing Baseline)',
      },
    ],
  ],
};
