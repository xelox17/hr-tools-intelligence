# Security

This document is the source of truth for what's actually enforced today —
not an aspirational policy. Where something is a documented gap rather than
a shipped control, it's called out explicitly.

## Architecture note: Proxy, not Middleware

Next.js 16 renamed the `middleware.ts` file convention to `proxy.ts` (see
the [migration notice](https://nextjs.org/docs/messages/middleware-to-proxy))
and, as of v16, **Proxy defaults to the Node.js runtime** instead of Edge.
That's why `proxy.ts` (project root) can safely call `lib/api-keys.ts`,
which queries Postgres via `pg` — `pg` uses raw TCP sockets, which the
(now-legacy) Edge runtime does not support. If you ever pin this app to
Next.js <15.2, split the JWT-only logic (Edge-safe, via `jose`) back out
from the API-key/DB logic before deploying — see the comment at the top of
`middleware/auth.ts`.

`proxy.ts` runs the whole pipeline for everything under `/api/*`
(`config.matcher: ['/api/:path*']`): payload-size guard → identity
resolution → rate limiting → sensitive-route auth gate → CORS + security
headers on every response, including error responses.

## Authentication: JWT vs API Keys

Two schemes are supported, checked in this order — a Bearer JWT takes
priority if both are present:

| Scheme | Header | Verified by | Use case |
|---|---|---|---|
| JWT | `Authorization: Bearer <token>` | `middleware/auth.ts`'s `verifyJwt` (HS256 via `jose`) — signature + expiration, no DB call | A logged-in human session |
| API key | `x-api-key: lhr_...` | `lib/api-keys.ts`'s `validateKey` — SHA-256 hash lookup against `api_keys`, checks `is_active` + `expires_at` | A script, integration, or service account |

**Which routes actually require one of these?** Only the ones created in
this pass — see [Route inventory](#route-inventory) below. Every
pre-existing route (dashboard, sync, alerts, exports, webhooks) is
deliberately left open: none of their current callers (the dashboard UI,
the n8n workflows in `workflows/`) send a token, and flipping enforcement
on for them today would break both with no corresponding client change in
this pass. Treat the JWT/API-key scheme as the contract new routes should
follow, not a statement that the whole API is locked down.

**`lib/auth.ts` is dead code**, superseded by `middleware/auth.ts` +
`proxy.ts`. It was never wired into any route (its `authenticateRequest`
always returned a hard-coded `dev-user`/`admin` identity) — safe to delete
in a follow-up cleanup pass.

### JWT_SECRET

- Required in production: `middleware/auth.ts` throws on first use if
  `JWT_SECRET` is unset and `NODE_ENV=production`.
- In dev, an insecure hard-coded fallback is used with a `console.warn` —
  convenient locally, never acceptable in a deployed environment.
- Must be ≥32 characters (HS256 minimum key strength) — a shorter value
  throws immediately, in every environment.
- Generate with: `openssl rand -base64 48`.

### Admin role

A JWT's `role` claim must equal `"admin"`. If `ADMIN_EMAILS` is set (comma
separated), the identity's `email` claim must *also* be on that list —
defense-in-depth against a forged or mis-issued `role` claim. Leave
`ADMIN_EMAILS` unset to trust the role claim alone.

### MFA

**Not implemented.** `/api/admin/settings` is gated on the admin role only.
Documented here as a future enhancement — see [Incident response](#incident-response-plan)
for what to do if an admin credential is suspected compromised in the
meantime.

## Rate limits

`middleware/rate-limit.ts`, applied by `proxy.ts` to every `/api/*`
request. In-memory `Map`-backed — correct for one instance, **not** shared
across multiple instances/regions. Swap in a Redis-backed store (implement
the same `RateLimitStore.increment()` contract, e.g. with `ioredis` or
`@upstash/ratelimit`) before running more than one instance; no Redis
client is provisioned in this project yet.

| Tier | Limit | Applies to |
|---|---|---|
| Public per IP | 100 req/min | Any request with no valid JWT or API key |
| Authenticated per IP | 1000 req/min | Any request with a valid JWT |
| Per API key | 500 req/min | Any request with a valid `x-api-key` (keyed by key id, not IP) |

Exceeding the limit returns `429` with a `Retry-After` header (seconds
until the window resets):

```json
{ "success": false, "error": { "code": "RATE_LIMITED", "message": "Too many requests. Please slow down." } }
```

Disable entirely (e.g. for local load testing) with `RATE_LIMIT_ENABLED=false`.

## API Key management

Full lifecycle lives in `lib/api-keys.ts` (`APIKeyManager`) and
`app/api/keys/route.ts`. Keys are one-way **SHA-256 hashed** for storage —
never encrypted, never recoverable. The plaintext key is returned exactly
once, at creation.

- **Create**: `POST /api/keys` — `{ name, ownerEmail, permissions[], expiresIn? }` (days, default 90). Requires a Bearer JWT (any role). Returns `{ success, key, keyId, expiresAt }` — copy `key` now, it is never shown again.
- **List**: `GET /api/keys` — returns every key's hash (`keyHash`), never the plaintext.
- **Revoke**: `DELETE /api/keys?id=<numeric id>` — soft-delete (`is_active = false`); the key stops authenticating immediately.
- **Rotation**: keys expire after `expiresInDays` (default 90). There is no auto-renewal — create a new key and revoke the old one before it expires. `last_used` is bumped on every successful `validateKey()` call, so you can tell a live integration from an abandoned key before revoking it.

Every create/revoke is written to `audit_trail` via `middleware/audit-log.ts`.

## Security headers

`middleware/security-headers.ts`, applied to every response by `proxy.ts`:

| Header | Value | Defends against |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | MIME-sniffing attacks |
| `X-Frame-Options` | `DENY` | Clickjacking |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Protocol downgrade / cookie hijacking over plain HTTP |
| `Content-Security-Policy` | `default-src 'self'` | XSS / data exfiltration via injected script or fetch |
| `X-XSS-Protection` | `1; mode=block` | Legacy browser XSS filter (superseded by CSP in modern browsers, kept for older clients) |

## CORS policy

`middleware/cors.ts`. Origins default to `http://localhost:3000`,
`http://localhost:3001`, `https://lesaffre.com` — override with a
comma-separated `CORS_ORIGINS` env var. Requests with no `Origin` header
(same-origin, curl, server-to-server, n8n) are always allowed through;
only browser cross-origin requests are checked against the allowlist.

- Methods: `GET, POST, PUT, DELETE, PATCH, OPTIONS`
- Headers: `Content-Type, Authorization, x-api-key`
- Credentials: `true` (only when the origin is on the allowlist)
- Preflight cache: `3600s`

## Input validation

`middleware/validation.ts`, called from route handlers (not the global
Proxy pipeline, except for the payload-size check — see below):

- `sanitizeString()` strips `<script>` tags — defense-in-depth against
  stored XSS. It does **not** strip SQL metacharacters (quotes,
  semicolons). That would corrupt legitimate data (e.g. the last name
  "O'Brien") and isn't how this codebase defends against SQL injection —
  every query in `lib/*.ts` / `app/api/**/route.ts` uses parameterized
  `$1, $2, ...` placeholders via `pg`, which is the actual defense.
  Character-blacklisting is a well-known bypassable pattern; see the
  [OWASP note](#owasp-top-10-mapping) below.
- `isValidEmail()`, `isValidUrl()`, `isValidUuid()` — format checks used
  by routes that accept those fields (e.g. `POST /api/keys`'s `ownerEmail`).
- `looksLikeSqlInjectionAttempt()` — a *detector* for logging/alerting on
  suspicious input shapes (`' OR 1=1`, `UNION SELECT`, `; DROP TABLE`). It
  does not mutate input and is not itself a security boundary.
- `isPayloadTooLarge()` — checked by `proxy.ts` for every request via the
  `Content-Length` header (no body buffering): payloads over **1MB**
  return `413`.

## Route inventory

Every route under `app/api/`. "Auth" = what `proxy.ts` requires before the
handler runs; routes also re-check identity themselves (defense in depth).

| Route | Methods | Auth required | Notes |
|---|---|---|---|
| `/api/health` | GET | None | |
| `/api/tools` | GET, POST | None | |
| `/api/sync/[tool]` | POST | None | Fires `sync.completed`/`sync.failed` webhooks |
| `/api/analytics/tool-health` | GET | None | |
| `/api/analytics/data-quality` | GET | None | |
| `/api/insights` | POST | None | Calls the Claude API (billed) |
| `/api/webhooks/subscribe` | GET, POST | None | URL validated (HTTPS or localhost) — see `isValidWebhookUrl` |
| `/api/webhooks/test` | POST | None | |
| `/api/alerts/rules` | GET, POST | None | |
| `/api/alerts/active` | GET | None | |
| `/api/alerts/acknowledge` | PUT | None | |
| `/api/alerts/history` | GET | None | |
| `/api/alerts/check` | POST | None | Runs the alert rule engine; fires `alert.triggered` webhooks |
| `/api/export/csv` | GET | None | |
| `/api/export/pdf` | GET | None | |
| `/api/export/schedule` | GET, POST, DELETE | None | Stores config only — no runner executes scheduled exports yet |
| `/api/swagger` | GET | None | Serves the OpenAPI spec |
| `/api/keys` | GET, POST, DELETE | **Bearer JWT (any role)** | 401 without a valid token |
| `/api/admin/settings` | GET, PATCH | **Bearer JWT, role: admin** | 401 without a token, 403 for a non-admin token |

All 19 routes get rate limiting, CORS headers, and security headers
regardless of the Auth column, since `proxy.ts`'s `matcher` covers
`/api/:path*` unconditionally.

## Audit logging

`middleware/audit-log.ts` writes to the pre-existing `audit_trail` table
(resource type/id, action, old/new values as JSONB, who, when, from where).
Node-only (DB write) — called explicitly from route handlers after a
mutation completes, not from the global Proxy pipeline. Currently wired
into `app/api/keys/route.ts` (CREATE/REVOKE) and
`app/api/admin/settings/route.ts` (UPDATE). Extend this to other mutating
routes (`POST /api/tools`, `PUT /api/alerts/acknowledge`, etc.) as they
become auth-gated — auditing an anonymous action has no `changedBy` to
record. Audit-log failures are caught and logged, never allowed to fail
the request they're auditing.

`resource_id` is a UUID column — `auditLog()` silently omits it (leaving
`NULL`) for non-UUID ids (e.g. `api_keys.id`, which is a plain integer);
the id still appears in `newValues`/`oldValues` JSON either way.

## Encryption at rest

`lib/crypto.ts` — AES-256-GCM `encrypt()`/`decrypt()`, keyed by
`ENCRYPTION_KEY` (must base64-decode to exactly 32 bytes: `openssl rand -base64 32`).
Intended for `tool_integrations`'s `*_encrypted` columns (stored
third-party credentials the connectors need to read back in plaintext to
call Cornerstone/ADP/Kelio) — **not** for API keys, which are one-way
SHA-256 hashed and never decrypted (see [API Key management](#api-key-management)).
Reversible encryption for something you only ever need to *compare*, never
*read back*, is a strictly worse choice: if `ENCRYPTION_KEY` ever leaks,
every encrypted value becomes recoverable, whereas a leaked hash database
reveals nothing usable.

## OWASP Top 10 mapping

| Category | Where addressed |
|---|---|
| A01 Broken access control | `proxy.ts`'s auth gate + per-route re-check (`app/api/keys`, `app/api/admin/settings`) |
| A02 Cryptographic failures | `lib/crypto.ts` (AES-256-GCM), `lib/api-keys.ts` (SHA-256 hashing), JWT via `jose` |
| A03 Injection | Parameterized queries everywhere (`pg`'s `$1, $2, ...`) — see `middleware/validation.ts`'s header comment for why character-blacklisting was deliberately *not* used instead |
| A04 Insecure design | `middleware/rate-limit.ts` |
| A05 Security misconfiguration | `middleware/security-headers.ts`, `middleware/cors.ts` |
| A06 Vulnerable/outdated components | Not addressed by this pass — run `npm audit` periodically |
| A07 Identification & auth failures | `middleware/auth.ts` (JWT + API key), documented gap: MFA (see above) |
| A08 Software/data integrity failures | Not addressed by this pass (no CI signing/SRI in scope) |
| A09 Logging & monitoring failures | `middleware/audit-log.ts`, rate-limit-exceeded warnings |
| A10 Server-side request forgery | Out of scope for this pass — see `docs/API.md`'s webhook URL validation note for the closest related control |

## Incident response plan

1. **Suspected leaked JWT_SECRET or ENCRYPTION_KEY**: rotate the env var
   immediately. Rotating `JWT_SECRET` invalidates every outstanding token
   (all callers must re-authenticate) — there is no token revocation list,
   so rotation is the only way to force this. Rotating `ENCRYPTION_KEY`
   requires re-encrypting every stored `*_encrypted` value first (decrypt
   with the old key, re-encrypt with the new one) or those values become
   unreadable.
2. **Suspected compromised API key**: `DELETE /api/keys?id=<id>` to revoke
   it immediately (takes effect on the next request — no caching). Check
   `audit_trail` for what that key did, and `last_used` for whether it's
   still active.
3. **Suspected compromised admin JWT**: rotate `JWT_SECRET` (see #1 — this
   is a blunt instrument, since it also logs out every other user) and
   review `audit_trail` for `security_settings`/`api_key` actions taken
   under that identity.
4. **Abuse / DoS pattern**: check the `⚠️ [proxy] 429 for ...` warnings in
   server logs for the offending IP or key. `RATE_LIMIT_ENABLED=false` is
   an escape hatch for debugging, not a mitigation — leave it `true` in
   production.
5. **After any incident**: write up what happened and what changed in a
   postmortem; this document should be updated if the response above
   turned out to be wrong or incomplete.

## Secrets management checklist

- [ ] `.env.local` is git-ignored (`.gitignore` already covers `.env*`) — never commit it.
- [ ] Copy `.env.example` → `.env.local` and fill in real values; `.env.example` itself must never contain a real secret (only placeholders/instructions).
- [ ] `JWT_SECRET`, `ENCRYPTION_KEY` are ≥32 bytes of real randomness (`openssl rand -base64 ...`), not a memorable phrase.
- [ ] Rotate `JWT_SECRET`/`ENCRYPTION_KEY` on any suspected leak (see Incident response above) — both are currently long-lived with no scheduled rotation.
- [ ] Connector API keys (`CORNERSTONE_API_KEY`, `ADP_API_KEY`, `KELIO_API_KEY`) and `ANTHROPIC_API_KEY` are per-environment — never share a prod key with dev.
- [ ] Before every commit: `git diff --staged` and eyeball it for anything that looks like a real key, especially in test fixtures or scratch files.
- [ ] `ADMIN_EMAILS` is reviewed whenever someone joins/leaves the admin group — it's a static allowlist, not tied to any user-management system.
