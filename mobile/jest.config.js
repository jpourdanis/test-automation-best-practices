module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: [],
  testMatch: ['<rootDir>/src/**/*.test.(ts|tsx|js|jsx)'],
  moduleNameMapper: {
    '^react$': '<rootDir>/node_modules/react',
    '^react/(.*)$': '<rootDir>/node_modules/react/$1',
    '^react-test-renderer$': require('path').join(__dirname, '..', 'node_modules', 'react-test-renderer'),
    '^react-test-renderer/(.*)$': require('path').join(__dirname, '..', 'node_modules', 'react-test-renderer') + '/$1',
    '^@testing-library/react-native$': require.resolve('@testing-library/react-native')
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
