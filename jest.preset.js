const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  collectCoverage: false, // Only collect when explicitly requested
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/test-setup.ts',
    '!src/main.ts',
    '!src/polyfills.ts',
  ],
  coverageReporters: ['text', 'text-summary', 'html', 'lcov', 'json', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
};
