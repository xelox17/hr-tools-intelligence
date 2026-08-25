# Deploying the Lesaffre HR Backend

## Environment variables

Set these in `.env.local` for development, or your host's env config in production.
None are validated at startup — a missing DB var silently falls back to the default
shown below; a missing connector/API key just makes that one feature fail at
request time with a logged warning.

| Variable               | Required | Default (if unset)         | Used by                                      |
| ------------------------ | :------: | ---------------------------- | ----------------------------------------------- |
| `DATABASE_URL`           | no (hosted Postgres) | — | `lib/database.ts` — when set, takes priority over the `DB_*` vars below and connects with SSL (`rejectUnauthorized: false`). Use this for Neon/Supabase/Railway/Vercel Postgres/etc. |
| `DB_HOST`                | no       | `localhost`                  | `lib/database.ts` — ignored if `DATABASE_URL` is set |
| `DB_PORT`                | no       | `5432`                       | `lib/database.ts`                                |
| `DB_NAME`                | no       | `lesaffre_hr`                 | `lib/database.ts`                                |
| `DB_USER`                | no       | `postgres`                    | `lib/database.ts`                                |
| `DB_PASSWORD`            | no       | `postgres`                    | `lib/database.ts`                                |
| `ANTHROPIC_API_KEY`      | for `/api/insights` | — (SDK throws if unset and used) | `app/api/insights/route.ts`                      |
| `CORNERSTONE_API_KEY`    | for Cornerstone sync | — (request 401/403s, logged warning) | `lib/connectors/cornerstone.ts`                  |
| `ADP_API_KEY`            | for ADP sync | — (same)                     | `lib/connectors/adp.ts`                          |
| `KELIO_API_KEY`          | for Kelio sync | — (same)                   | `lib/connectors/kelio.ts`                        |
| `JWT_SECRET`             | no (auth not enforced yet — see `docs/API.md`) | `dev-secret-min-32-characters-long` | `lib/auth.ts` |

The three connector API keys point at placeholder hostnames
(`api.cornerstone.com`, `api.adp.fr`, `api.kelio.com`) that are not real
Lesaffre-provisioned endpoints — replace both the base URL in each connector
file and the key before pointing this at production systems.

## PostgreSQL setup

1. Create the database (name matches `DB_NAME`, default `lesaffre_hr`):
   ```bash
   createdb lesaffre_hr
   ```
2. Apply the schema files **in order** — each is additive (`CREATE TABLE IF NOT EXISTS`)
   except `03_alerts_schema.sql`, which drops and recreates `alerts` to change its
   column shape (safe only because that table was empty in every environment this
   has been applied to — see the comment at the top of that file):
   ```bash
   psql -d lesaffre_hr -f 01_lesaffre_schema.sql
   psql -d lesaffre_hr -f 02_webhooks_schema.sql
   psql -d lesaffre_hr -f 03_alerts_schema.sql
   psql -d lesaffre_hr -f 04_exports_schema.sql
   ```
3. `01_lesaffre_schema.sql` also seeds 5 tools (Cornerstone LMS, ADP France, Kelio,
   BioLearn Campus, SkillForge Poland) and `03_alerts_schema.sql` seeds the 5
   built-in alert rules (`QUALITY_DEGRADATION`, `SYNC_FAILURE_STREAK`,
   `NO_SYNC_24H`, `HIGH_ISSUE_RATE`, `API_TIMEOUT`) with their default thresholds.
4. No migration tool is wired up (no Prisma/Knex/node-pg-migrate) — these `.sql`
   files are applied by hand. If you add a 5th schema file, keep the `0N_` prefix
   convention so apply order stays obvious.

`lib/database.ts` uses a single pooled `pg.Pool` (`max: 20`) via a
`DatabaseManager` singleton — no read replicas, no connection-string TLS options
set by default. For a managed Postgres provider that requires TLS, add
`ssl: { rejectUnauthorized: false }` (or your CA) to the `Pool` config.

## n8n configuration

Four workflow JSON files in `workflows/` are meant to be imported into n8n
(*Workflows → Import from File*) and left `active: true`:

| File                      | Cron (Europe/Paris) | Calls                          |
| --------------------------- | :--------------------: | --------------------------------- |
| `cornerstone-sync.json`     | `0 2 * * *` (2am)       | `POST /api/sync/cornerstone`      |
| `adp-sync.json`             | `0 3 * * *` (3am)       | `POST /api/sync/adp`              |
| `kelio-sync.json`           | `0 4 * * *` (4am)       | `POST /api/sync/kelio`            |
| `alerts-check.json`         | `0 * * * *` (hourly)    | `POST /api/alerts/check`          |

Each workflow: Schedule Trigger → HTTP Request → a Code node that
`console.log`s the JSON result (visible in n8n's execution log).

**Reachability gotcha:** the HTTP Request nodes hard-code `http://localhost:3000`.
That only works if n8n runs on the same host/network namespace as this app. If
n8n runs in its own Docker container, replace `localhost` with the app's Docker
service name (Compose) or `host.docker.internal` (Docker Desktop) before
importing.

**Not yet wired up:** `scheduled_exports` (created via `POST /api/export/schedule`)
has no corresponding n8n workflow or `/api/export/schedule/run` endpoint — rows
you create there record intent (`next_run`, `recipients`) but nothing executes
them yet. Add a 5th n8n workflow + a runner endpoint before relying on this for
real report delivery.

## Production checklist

- [ ] Enforce authentication — wire `withAuth` into every route (`docs/API.md` →
      Authentication) and rotate `JWT_SECRET`.
- [ ] Put a rate limiter in front of `/api/sync/*`, `/api/insights`, `/api/export/*`
      (`docs/API.md` → Rate limits).
- [ ] Replace the three connector base URLs (`api.cornerstone.com`, `api.adp.fr`,
      `api.kelio.com`) with real Lesaffre-provisioned endpoints and set real API keys.
- [ ] Configure Postgres TLS (`lib/database.ts`'s `Pool` options) if the managed
      DB provider requires it.
- [ ] Decide who can create `webhooks_subscriptions` — `POST /api/webhooks/subscribe`
      is unauthenticated today, so anyone reaching this API can register an
      exfiltration endpoint for every internal event.
- [ ] Build the `scheduled_exports` runner (cron + delivery) before advertising
      "scheduled reports" as a working feature — see the n8n section above.
- [ ] Add an actual email-sending integration if `recipients[]` on scheduled
      exports should ever be used (none is wired up — see `docs/API.md`).
- [ ] Set `NODE_ENV=production` and run `npm run build && npm run start` rather
      than `npm run dev`.
- [ ] Point `servers` in `lib/swagger-config.ts` at the real production hostname
      once one exists (`https://api.lesaffre.com` is currently a placeholder) and
      regenerate `public/openapi.json` (`curl <server>/api/swagger > public/openapi.json`).
- [ ] Review `01_lesaffre_schema.sql`'s seed `INSERT`s — decide whether the 5
      demo tools ship to production or are dev-only fixtures.
