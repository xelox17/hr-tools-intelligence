# Testing

## Running tests

```bash
npm test              # run the full suite once
npm run test:watch    # re-run on file change
npm run test:coverage # run with a coverage report (text summary in the terminal
                       # + an HTML report at coverage/lcov-report/index.html)
```

**Integration tests need a running PostgreSQL instance** with the same schema
this app uses in dev — `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD`
(defaults: `localhost`/`5432`/`lesaffre_hr`/`postgres`/`postgres`, see
`docs/DEPLOY.md`). There is no separate test database — integration tests run
against the same dev database the app itself uses, and clean up every row
they create in `afterEach`/`afterAll`. Unit tests (`lib/__tests__/`) never
touch a real database; they mock `DatabaseManager` and don't need Postgres
running at all.

If Postgres isn't reachable, only the files under `__tests__/api/` will
fail (connection errors) — `lib/__tests__/` still passes.

## Layout

```
lib/__tests__/        unit tests — business logic, DB/HTTP mocked
__tests__/api/         integration tests — real DB, route handlers called directly
__tests__/api/helpers.ts   shared request-building helpers (not a test file —
                            excluded via jest.config.js testPathIgnorePatterns,
                            since Jest's default testMatch treats every .ts
                            file under __tests__/ as a suite otherwise)
```

Integration tests import the route handler functions directly
(`import { GET } from '@/app/api/health/route'`) and call them with a
`NextRequest` built by `buildRequest()` from `helpers.ts` — no dev server or
open port is needed for most routes. `next dev`/`next build` and the test
suite are otherwise independent; you don't need the app running to run tests.

## Coverage

`jest.config.js` scopes `collectCoverageFrom` to the modules this suite
actually targets — `lib/database.ts`, `lib/webhooks.ts`, `lib/tool-health.ts`,
`lib/alerts/**`, `lib/connectors/**`, `lib/export/**`, and the API routes
under `health`, `tools`, `sync`, `analytics`, `webhooks`, `alerts`. React
components, hooks, and routes not covered by this suite (e.g.
`/api/insights`, `/api/export/csv`) are intentionally excluded — measuring
the whole app against the same threshold would be meaningless (nothing
exercises a `<Card>` component here) and guaranteed to fail. Thresholds:
**70% statements / 60% branches**, checked against that scoped set.

Two routes inside the scoped globs (`app/api/alerts/history`,
`app/api/alerts/rules`) have no dedicated integration test file and show 0%
coverage individually — the aggregate still clears the threshold. Add
`__tests__/api/alerts-rules.integration.test.ts` (or extend
`alerts.integration.test.ts`) if you want those covered explicitly.

## Adding a new test

**Unit test** (`lib/__tests__/your-module.test.ts`): mock every collaborator
that touches the network or a database.

```ts
import DatabaseManager from '@/lib/database';
import { thingUnderTest } from '@/lib/your-module';

jest.mock('@/lib/database');

describe('thingUnderTest', () => {
  it('does the thing', async () => {
    const mockDb = { connect: jest.fn().mockResolvedValue(undefined), query: jest.fn().mockResolvedValue({ rows: [] }) };
    (DatabaseManager.getInstance as jest.Mock).mockReturnValue(mockDb);

    await expect(thingUnderTest()).resolves.toEqual(/* ... */);
  });
});
```

**Integration test** (`__tests__/api/your-route.integration.test.ts`): call
the real handler, use the real DB, clean up what you create.

```ts
import { GET } from '@/app/api/your-route/route';
import DatabaseManager from '@/lib/database';
import { buildRequest, readJson } from './helpers';

afterAll(async () => {
  await DatabaseManager.getInstance().close(); // avoids Jest "open handle" warnings
});

it('returns 200', async () => {
  const response = await GET(buildRequest('/api/your-route?x=1'));
  const body = await readJson(response);
  expect(response.status).toBe(200);
});
```

If your route creates rows, track their ids and delete them in
`afterEach`/`afterAll` — see `__tests__/api/tools.integration.test.ts` (slug
prefix `test-jest-...`) or `alerts.integration.test.ts` (id list) for the
two patterns used elsewhere in this suite. Don't `TRUNCATE` or bulk-delete
by a loose condition — this is the shared dev database, not a sandbox.

## Mocking patterns used in this suite

| What you're testing | Mock this | How |
|---|---|---|
| Code that queries Postgres | `@/lib/database` | `jest.mock('@/lib/database')`, then `(DatabaseManager.getInstance as jest.Mock).mockReturnValue(mockDb)` where `mockDb = { connect: jest.fn(), query: jest.fn() }`. If the SUT fires concurrent queries (e.g. `Promise.all`), don't rely on call order — branch `query`'s mock implementation on a distinctive substring of the SQL text instead (see `lib/__tests__/alerts.test.ts`'s `makeMockDb`). |
| Code that calls an external HTTP API via axios | `axios` | `jest.mock('axios')`. If the module under test builds its own client via `axios.create()` (all of `lib/connectors/*`, `lib/webhooks.ts`), mock `axios.create` to return `{ request: jest.fn() }` and control that mock — not the top-level `axios` methods. |
| Retry/backoff logic (`lib/connectors/http.ts`'s `requestWithRetry`, 3 attempts) | — (real logic, fake timers) | `jest.useFakeTimers()`, kick off the call, `await jest.runAllTimersAsync()`, then await the result. Without fake timers a retry-exhausted test takes ~3 real seconds (1s + 2s backoff). |
| Real webhook/HTTP delivery end-to-end | nothing — use a real local server | `http.createServer(...).listen(0, '127.0.0.1')` (port 0 = OS-assigned, avoids collisions) and point the subscription/test URL at it. `isValidWebhookUrl` explicitly allows `http://127.0.0.1` and `http://localhost` for exactly this. See `__tests__/api/webhooks.integration.test.ts`. |
| PDF/ZIP generation (`pdfkit`, `lib/export/zip.ts`) | nothing — run for real | Both are pure, I/O-free libraries; mocking them would just test the mock. Assert structural properties instead (PDF magic bytes `%PDF-` / `%%EOF` trailer; ZIP local-file-header signature `0x04034b50` + round-trip through `zlib.inflateRawSync` back to the original bytes). |

Global config in `jest.setup.ts` only sets the default test timeout —
everything else is mocked per-file as above, deliberately: a global axios
auto-mock would silently break the webhook/connector integration tests that
need a real local HTTP call to succeed.
