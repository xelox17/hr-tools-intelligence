// Runs after the test framework is installed, before each test file.
//
// Mocking convention used throughout this suite (documented in docs/TESTING.md):
//   - HTTP (axios): `jest.mock('axios')` per test file, then cast the import
//     as `jest.Mocked<typeof axios>` — explicit per-file mocking beats a
//     global auto-mock here, since some integration tests deliberately spin
//     up a real local HTTP server to verify webhook delivery.
//   - Database: unit tests `jest.mock('@/lib/database')`; integration tests
//     use the real DatabaseManager against the dev PostgreSQL instance
//     (same DB_* env vars as the app — see docs/TESTING.md) and clean up
//     their own rows in afterEach/afterAll.
//
// `clearMocks: true` in jest.config.js already resets mock call history
// between tests, so no manual afterEach() is needed here for that.

jest.setTimeout(10000);
