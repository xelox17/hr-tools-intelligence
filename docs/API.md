# Lesaffre HR Backend API

Interactive docs: `/api-docs` (Swagger UI). Machine-readable spec: `GET /api/swagger`
or the static snapshot at `public/openapi.json` (importable into Postman/Insomnia).

All endpoints are relative to a server from `servers` in the OpenAPI spec:
`http://localhost:3000` (dev) or `https://api.lesaffre.com` (prod placeholder —
not a real deployment target yet).

## Authentication

The OpenAPI spec declares a `bearerAuth` security scheme (`Authorization: Bearer <JWT>`),
and `lib/auth.ts` exists with `extractToken` / `authenticateRequest` / `withAuth` helpers —
**but no route currently imports or calls `withAuth`**. Every endpoint in this API is
reachable with no `Authorization` header at all today. Treat the scheme as a documented
contract for where auth *will* attach, not a statement that it's enforced.

Before exposing this API outside a trusted network:

1. Wrap each route handler in `withAuth` (or equivalent middleware).
2. Replace `authenticateRequest`'s hard-coded `dev-user` context with real JWT
   verification (`JWT_SECRET` env var is already read as a fallback-only default —
   rotate it).
3. Decide per-route authorization (e.g. read-only analytics vs. destructive
   `DELETE /api/export/schedule`).

## Rate limits

Not implemented. No middleware, in-memory counter, or reverse-proxy rule currently
throttles requests. For production, put a rate limiter in front of write/expensive
routes first:

- `POST /api/sync/{tool}` — calls a real external API per request; can also be
  driven by the n8n cron workflows in `workflows/`, so a runaway client script is
  the main risk to guard against.
- `POST /api/insights` — calls the Claude API (billed per call).
- `POST /api/alerts/check` — cheap per call, but meant to run hourly, not per-click.
- `GET /api/export/csv` / `GET /api/export/pdf` — unbounded query + PDF rendering
  per request.

## Error codes

Every non-2xx JSON response (except the two exceptions noted below) follows:

```json
{
  "success": false,
  "error": { "code": "BAD_REQUEST", "message": "...", "details": null },
  "meta": { "timestamp": "...", "requestId": "..." }
}
```

| HTTP | `error.code`          | Meaning                                            |
| ---- | ---------------------- | --------------------------------------------------- |
| 400  | `BAD_REQUEST`           | Missing/invalid body field or query param.           |
| 401  | `UNAUTHORIZED`          | Defined for future use; not currently returned.      |
| 403  | `FORBIDDEN`             | Defined for future use; not currently returned.      |
| 404  | `NOT_FOUND`             | Resource (alert, tool, subscription, schedule) missing. |
| 409  | `CONFLICT`              | Unique constraint would be violated (duplicate name/slug). |
| 500  | `INTERNAL_ERROR`        | Unhandled exception; `error.details` carries the raw message. |

**Exceptions to this envelope** (routes that predate/bypass `lib/response.ts`):
- `GET /api/health` on failure returns `{ "status": "unhealthy", "error": "..." }` with `503`.
- `POST /api/sync/{tool}` returns `{ "success": false, "error": "..." }` directly (no `error.code`).
- `POST /api/webhooks/subscribe`, `POST /api/webhooks/test`, `POST /api/insights` — same flat shape.

## Example requests

### curl

```bash
# Health check
curl http://localhost:3000/api/health

# List tools (paginated, filtered)
curl "http://localhost:3000/api/tools?page=1&pageSize=10&search=cornerstone"

# Trigger a sync
curl -X POST http://localhost:3000/api/sync/cornerstone

# Get active alerts
curl http://localhost:3000/api/alerts/active

# Acknowledge an alert (both fields required)
curl -X PUT http://localhost:3000/api/alerts/acknowledge \
  -H "Content-Type: application/json" \
  -d '{"alertId":"<uuid>","acknowledgedBy":"anas@lesaffre.com"}'

# Download a CSV export
curl -OJ "http://localhost:3000/api/export/csv?type=tools"

# Subscribe a webhook
curl -X POST http://localhost:3000/api/webhooks/subscribe \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/hook","events":["sync.completed","alert.triggered"]}'

# Delete a scheduled export — note: id is a query param, not a path segment
curl -X DELETE "http://localhost:3000/api/export/schedule?id=<uuid>"
```

### Node / fetch

```js
const res = await fetch("http://localhost:3000/api/alerts/history?severity=critical&page=1");
const { success, data } = await res.json();
if (success) {
  console.log(data.items, data.total);
}
```

## Webhook events format

Outbound deliveries (`lib/webhooks.ts`) POST this envelope to every active
subscription whose `events[]` includes the event name:

```json
{
  "event": "sync.completed",
  "timestamp": "2026-08-24T21:00:19.948Z",
  "data": { "...": "event-specific payload, see below" }
}
```

| Event                 | Fired from                | `data` shape                                                             |
| ---------------------- | -------------------------- | -------------------------------------------------------------------------- |
| `sync.completed`       | `POST /api/sync/{tool}`     | `{ tool, recordsSynced, recordsFailed, status, syncId }`                    |
| `sync.failed`          | `POST /api/sync/{tool}`     | `{ tool, error, syncId }`                                                   |
| `alert.triggered`      | `POST /api/alerts/check`    | `{ alertId, rule, tool, severity, message }`                                |
| `data.quality.alert`   | *(reserved — not yet fired by any route)*                                                              |

Delivery: `lib/connectors/http.ts`'s `requestWithRetry` — **3 attempts**, exponential
backoff (1s, then 2s between attempts), **30s timeout** per attempt. Delivery runs
fire-and-forget from the triggering route (never blocks the HTTP response), and
every trigger is logged to the `webhook_events` table (falls back to `console.log`
if that table is missing) with a `subscribers_notified` / `subscribers_failed` count.

Subscription URLs are validated at creation time (`POST /api/webhooks/subscribe`)
to be either `https://` or `http://localhost` / `http://127.0.0.1` — see
`isValidWebhookUrl` in `lib/webhooks.ts`. This blocks obviously-wrong URLs but is
**not** a full SSRF hardening (a private IP behind a valid HTTPS cert would pass).
Test any subscription immediately with `POST /api/webhooks/test`.
