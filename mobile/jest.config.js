module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: [],
  testMatch: ['<rootDir>/src/**/*.test.(ts|tsx|js|jsx)'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'allure-results', outputName: 'junit-mobile-unit-tests.xml' }]
  ],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover']
}
