# Frontend

This documents what the frontend actually does today — component library,
design tokens, hooks, navigation, and dark mode — plus what was explicitly
scoped out. Same rule as `docs/SECURITY.md`: no aspirational claims.

## Stack

Next.js 16 App Router, React 19, TypeScript (strict), Tailwind CSS 4,
`@base-ui/react` primitives wrapped shadcn-style in `components/ui/*.tsx`
(note: `render`/`useRender` prop, **not** the shadcn/radix `asChild`/Slot
convention — see `components/ui/button.tsx` for the pattern any new
wrapper should follow), `recharts` for charts, `sonner` for toasts,
`next-themes` for dark mode, `lucide-react` for icons.

## Design tokens (`app/globals.css`)

Brand palette: Lesaffre navy `--lesaffre-navy: #0a1f44` and green
`--lesaffre-green: #00a88e` in light mode. The existing palette was kept
rather than switched to a new blue — ~15 files already reference the navy/
green tokens, and reintroducing a second brand color would fragment the
system for no functional gain.

Dark mode (`.dark` block) is a brand-consistent dark-navy scheme, not a
generic gray:

| Token | Value | Use |
|---|---|---|
| `--background` | `#0a1120` | page background |
| `--card` / `--popover` | `#101a30` | surfaces |
| `--primary` / `--accent` | `#00c9a7` | brand accent (teal, readable on dark navy) |
| `--sidebar` | `#060d1c` | sidebar, darker than page background |
| `--chart-1..5` | blue/teal/amber/purple ramp | chart series, referenced as `var(--chart-1)` etc. |

Charts (`components/ui/chart.tsx`) style exclusively via these CSS
variables, so they repaint correctly on theme toggle with no JS involved.
Older chart components (`components/charts/*.tsx`, used by the pre-existing
home dashboard widgets) still use hardcoded hex colors and were **not**
retrofitted — out of scope for this pass, and touching them risked
regressing an already-working integration.

Typography: Inter (`--font-sans`, body) and Sora (`--font-heading`,
headings/titles) — both loaded via `next/font/google` in `app/layout.tsx`.

## Dark mode

`next-themes` with `attribute="class"`, `defaultTheme="system"`,
`enableSystem`. The toggle lives in `components/header.tsx` (`ThemeToggle`),
built on `hooks/useDarkMode.ts`, which wraps `useTheme()` and exposes
`{isDark, mounted, toggle}`. The `mounted` guard exists because
`resolvedTheme` is only meaningful client-side — using it during SSR would
cause a hydration mismatch (the toggle icon renders a neutral state until
mounted).

## Layout

`app/layout.tsx`: `Sidebar` (left, fixed) + a column of `Header` (top,
sticky breadcrumb bar) and `<main>` (scrollable page content). On mobile
(`<768px`), `Sidebar` collapses to a top bar with a hamburger that opens a
slide-in drawer (`components/sidebar.tsx`).

### Navigation structure

```
Home (/)
Catalog (/catalog)
AI Insights (/insights)
─ Dashboard ─────────────
  Overview        /dashboard
  Health          /dashboard/health
  Alerts          /dashboard/alerts
  Integrations    /dashboard/integrations
  Exports         /dashboard/exports
─ Admin ─────────────────
  API Keys        /dashboard/api-keys
  Settings        /dashboard/admin/settings
  Audit Logs      /dashboard/audit
API Docs (/api-docs)
```

`components/sidebar.tsx` exports `NAV_LABELS`, a flattened `href → label`
map, consumed by `components/header.tsx`'s `Breadcrumbs` so the nav
structure isn't duplicated. Active-link highlighting uses a
longest-prefix-match over every flattened nav leaf (`useActiveHref`).

### Header (`components/header.tsx`)

- **Breadcrumbs** — derived from `usePathname()`, no per-page wiring needed.
- **Notification bell** — `hooks/useNotifications.ts`, polling-based (see
  below), shows the 8 most recent active alerts, links to `/dashboard/alerts`.
- **Theme toggle** — see above.
- **Admin status** — reflects whether `hooks/useAdminToken.ts` has a token
  set (not a real user session — see below), links to the settings page.

## The admin-token bridge (important caveat)

**There is no login/auth UI.** `/api/keys` and `/api/admin/*` require a
Bearer JWT (`proxy.ts`), but nothing in the frontend issues one. Until a
real auth flow exists, `hooks/useAdminToken.ts` + `components/admin/
AdminTokenBar.tsx` provide a pragmatic bridge: paste a token, it's kept in
`localStorage` and attached via `authHeaders(token)`. This gates
`/dashboard/api-keys`, `/dashboard/admin/settings`, and `/dashboard/audit`.
Treat this as an interim developer/demo convenience, not a security
boundary — it is one.

## "Real-time" = polling

There is no WebSocket/SSE channel in this backend (only outbound webhook
delivery to third-party URLs). Every "live" hook — `useAlerts`,
`useToolHealth`, `useDataQuality`, `useNotifications` — polls its endpoint
every 30s via `setInterval`, with an immediate first fetch via
`setTimeout(fn, 0)` inside the effect (not a bare synchronous `setState`
call — required by the `react-hooks/set-state-in-effect` lint rule; see
any of the hooks above for the pattern to copy).

## Hooks (`hooks/`)

| Hook | Purpose |
|---|---|
| `useLocalStorage<T>` | Persisted state, cross-tab sync via the `storage` event, SSR-safe (`hydrated` flag). |
| `useDarkMode` | Thin `next-themes` wrapper, see above. |
| `usePagination` | `{page, pageSize, totalPages, offset, next, prev, goTo}` — backs `DataTable`. |
| `useNotifications` | Polls `/api/alerts/active`, toasts genuinely new alert ids, persists unread count/last-seen via `useLocalStorage`. |
| `useAdminToken` | See above. |
| `useAlerts` / `useToolHealth` / `useDataQuality` | Pre-existing polling hooks the alerts/health pages build on. |

## Components (`components/ui/`)

Existing shadcn-style primitives: `button`, `input`, `card`, `select`,
`skeleton`, `separator`, `sonner`. Added this pass:

- **`dialog.tsx`** — already existed and doubles as the "Modal" component;
  no separate Modal was built. Override `className` on `DialogContent` for
  a wider modal (see the tool-health detail modal, `max-w-2xl`).
- **`data-table.tsx`** — generic `DataTable<T>`: sortable/searchable/
  paginated/selectable, row actions, built on `usePagination`.
- **`chart.tsx`** — `SimpleLineChart` / `SimpleBarChart` / `SimplePieChart`,
  thin `recharts` wrappers styled via CSS variables (dark-mode safe).
- **`timeline.tsx`** — `Timeline`/`TimelineItem`, used by the audit log
  and the tool-health sync-activity modal.
- **`alert.tsx`** — `showAlert()` (toast wrapper) + `InlineAlert` (banner).
- **`tabs.tsx`** / **`switch.tsx`** — thin `@base-ui/react` wrappers,
  same pattern as the pre-existing primitives.
- **`badge.tsx`** — extended with `critical`/`warning`/`info`/`success`
  severity variants (light+dark classes) and a `size` (`sm`/`md`/`lg`)
  variant, used everywhere a status needs a colored pill.

## Pages added or refactored this pass

| Page | Notes |
|---|---|
| `/dashboard/api-keys` | Key list (`DataTable`), generate-key dialog, one-time plaintext reveal + copy-to-clipboard. Real backend. |
| `/dashboard/admin/settings` | Tabs: Security / Rate Limits / CORS / Webhooks, backed by `GET`/`PATCH /api/admin/settings`. Webhook tab's "Test" button calls the real `/api/webhooks/test`. |
| `/dashboard/audit` | Timeline view of `audit_trail`, filters, shallow before/after diff viewer, CSV export. New minimal `GET /api/admin/audit` route (the table existed, nothing exposed it). |
| `/dashboard/alerts` | Gradient severity cards, group-by tool/severity, filter/sort, "alerts per day" and "top rules" charts from `/api/alerts/history`. Acknowledge/Resolve are real (the `acknowledge` route now accepts an optional `status` of `acknowledged`\|`resolved` — no new columns needed, reuses `acknowledged_at`/`acknowledged_by`). **Snooze is not implemented** — the `alerts` table has no `snoozed_until` column; the buttons are disabled with a "Coming soon" tooltip rather than faking the behavior. |
| `/dashboard/health` | Hero health-score ring + uptime/status KPIs, clickable tool grid opening a modal with real quality-trend and sync-count charts plus a sync-activity timeline — backed by a new `GET /api/analytics/tool-health/[toolId]` route reading the existing `data_quality_metrics`/`sync_logs` tables (nothing new was fabricated; both tables already existed and simply weren't exposed per-tool). |
| `/dashboard/integrations` | Card grid over real `/api/tools` + `/api/analytics/tool-health` data. **Configure** and **Test Connection** are disabled ("Coming soon") — there's no `tool_integrations` CRUD backend; building one was out of scope for this pass. **View Logs** links to `/dashboard/health`, avoiding a duplicate sync-log feature. |
| `/dashboard/exports` | Renamed from `/dashboard/export` (singular). Same real download/schedule flow as before, plus an explicit "auto-drop after 30 days" label on the scheduled-exports list. |
| `/dashboard` (home) | Refactored into a summary: 4 KPI cards, quick-action links, top-5 alerts + "View all", a 6-tool health preview + "View all", all feeding the existing `useDashboardRefresh` "last updated" indicator. |

## Explicitly deferred

Storybook, automated visual regression testing, a formal WCAG 2.1 AA audit,
and Lighthouse CI were **not** set up this pass — each is a real, standalone
tooling investment (CI wiring, baseline snapshots, an audit checklist) that
would take longer than the features it's meant to validate, for a project
at this stage. Basic accessibility practice (labeled icon-only buttons,
`aria-label`s on the notification bell/theme toggle/mobile menu, focus-
visible rings from the base `@base-ui/react` primitives) is still in place
throughout — it just hasn't been audited against the full AA checklist.

Also deferred: alert snooze (see above), `tool_integrations` CRUD, a
cron-expression builder for schedules, React Query, and list
virtualization (`DataTable` paginates instead — nothing in this app
currently renders a list long enough to need virtualization).
