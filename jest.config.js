// eslint-disable-next-line @typescript-eslint/no-require-imports -- Jest config files are CommonJS.
const nextJest = require('next/jest');

// next/jest wires up SWC-based TS/JSX transforms, tsconfig path aliases
// (@/*), and .env loading automatically — no ts-jest/babel config needed.
const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testTimeout: 10000,
  clearMocks: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Jest's default testMatch treats every .ts file under __tests__/ as a
  // test file — helpers.ts is a shared utility, not a suite, so exclude it.
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/__tests__/api/helpers.ts',
  ],
  // Coverage is scoped to the modules this suite actually exercises (lib/
  // business logic + the API routes covered by the integration tests) —
  // measuring the whole app (React components, hooks, untested routes)
  // against the same threshold would be meaningless and guaranteed to fail.
  collectCoverageFrom: [
    'lib/database.ts',
    'lib/webhooks.ts',
    'lib/tool-health.ts',
    'lib/api-keys.ts',
    'lib/alerts/**/*.ts',
    'lib/connectors/**/*.ts',
    'lib/export/**/*.ts',
    'middleware/rate-limit.ts',
    'middleware/auth.ts',
    'middleware/validation.ts',
    'app/api/health/**/*.ts',
    'app/api/tools/**/*.ts',
    'app/api/sync/**/*.ts',
    'app/api/analytics/**/*.ts',
    'app/api/webhooks/**/*.ts',
    'app/api/alerts/**/*.ts',
    // lib/crypto.ts, middleware/{cors,security-headers,audit-log}.ts, and
    // app/api/{keys,admin/settings} are new this pass but have no
    // dedicated test file yet (only rate-limit/auth/validation/api-keys
    // were asked for) — excluded from coverage measurement for the same
    // reason as the untested routes below: an unmeasured 0% would just
    // pull the aggregate down without saying anything about test quality.
  ],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 60,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
