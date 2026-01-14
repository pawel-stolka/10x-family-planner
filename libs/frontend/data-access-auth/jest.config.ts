export default {
  displayName: 'data-access-auth',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/frontend/data-access-auth',
  transformIgnorePatterns: [
    'node_modules/(?!(@angular|rxjs)/)',
  ],
  moduleNameMapper: {
    '^@angular/common/http$': '<rootDir>/../../../node_modules/@angular/common/fesm2022/http.mjs',
    '^@angular/core$': '<rootDir>/../../../node_modules/@angular/core/fesm2022/core.mjs',
    '^@angular/router$': '<rootDir>/../../../node_modules/@angular/router/fesm2022/router.mjs',
  },
};
