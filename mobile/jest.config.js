module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: [],
  testMatch: ['<rootDir>/src/**/*.test.(ts|tsx|js|jsx)'],
  moduleNameMapper: {
    '^react$': '<rootDir>/../node_modules/react',
    '^react-test-renderer$': '<rootDir>/../node_modules/react-test-renderer',
    '^@testing-library/react-native$': '<rootDir>/../node_modules/@testing-library/react-native'
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'allure-results', outputName: 'junit-mobile-unit-tests.xml' }]
  ],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/i18n.ts', '!src/api/client.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover']
}
