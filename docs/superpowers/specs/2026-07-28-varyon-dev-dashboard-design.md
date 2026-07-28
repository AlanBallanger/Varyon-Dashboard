# Varyon Dev Dashboard — Design Spec

Date: 2026-07-28  
Status: Approved for implementation planning

## Goal

Build a **Varyon Dev Dashboard**: a web-only ops UI to monitor the Hytale Varyon server.  
V1 priority: **consult logs** via Loki, plus **Joueurs** and **Mods**. No Tauri, no Rust.

## Tech stack (frontend)

Same web stack as Scrow (UI only):

- Vue 3 (Composition API)
- TypeScript
- Vite 6
- Vue Router 4
- Tailwind CSS + DaisyUI
- @tabler/icons-vue (named imports)
- pnpm
- French UI, dark ops theme

No Pinia required for V1 (composables + small services). No vue-i18n for V1 (hardcoded FR).

## Architecture

```
Browser (Vue SPA)
  → API Node locale (dev: Vite middleware or :8787; prod: same host)
      → Loki       (LogQL — server logs)
      → Prometheus (PromQL — players / runtime metrics)
      → Filesystem (/opt/hytale/server/mods — installed mods list)
```

The Node layer is a thin proxy/normalizer. It does not replace Grafana; it serves the dashboard UX.

### Why Loki (not file poll)

Logs already land under `/opt/hytale/server/logs`, and Loki is available. Querying Loki is cleaner than re-implementing file tail (search, labels, live stream, same model as Grafana). File path remains documented as the source Promtail/Alloy ships from; the dashboard reads **Loki**.

### Why a small Node API

The browser cannot talk to Loki/Prometheus/FS with sensible CORS/secrets and path access. A colocated Node API on the Hytale host (or LAN) proxies those backends.

## V1 scope

| Tab        | Status | Source                                      |
|------------|--------|---------------------------------------------|
| Logs       | Full   | Loki                                        |
| Joueurs    | Full   | Prometheus (best-effort labels/series)      |
| Mods       | Full   | `/opt/hytale/server/mods` + optional Prom   |
| Console, TPS, RAM, CPU, Spark, Threads, World Save, Scheduler | Nav placeholders (“bientôt”) | — |

Out of scope V1: auth, write/console commands, Spark UI, alerting, multi-server.

## Configuration

Environment variables (`.env` / process env):

```env
LOKI_URL=http://localhost:3100
PROMETHEUS_URL=http://localhost:9090
HYTALE_MODS_PATH=/opt/hytale/server/mods
LOKI_LOG_SELECTOR={job="hytale"}
API_PORT=8787
```

`LOKI_LOG_SELECTOR` is adjustable once real Loki labels are confirmed.  
No auth in V1 (localhost / LAN assumed).

## UI design

- Dark ops layout
- Left sidebar: Varyon branding + nav (active tabs + disabled future tabs)
- Top status chips: Loki / Prometheus reachability
- Routes: `/logs`, `/joueurs`, `/mods`
- Tabler icons, DaisyUI components where useful, Tailwind utilities
- French copy

### Logs view

- LogQL base selector from config; optional free-text filter appended
- Level filter: ALL / INFO / WARN / ERROR (client-side and/or LogQL line filter)
- Time range presets + live tail (short-interval query or Loki tail API)
- Auto-scroll with pause
- Level-colored lines
- Clear empty / error / unreachable states

### Joueurs view

- Poll Prometheus every 5–10s
- Show online count; list players if metric labels expose names
- If expected metrics missing: explicit message + config hint (no silent empty)

### Mods view

- List jar/folders under `HYTALE_MODS_PATH`
- Enrich with Prometheus series when available
- FS-only is acceptable if no mod metrics exist

## API surface (Node)

Suggested endpoints:

- `GET /api/health` — Loki + Prometheus ping status
- `GET /api/logs/query?start&end&limit&filter&level` — proxy LogQL range query
- `GET /api/logs/tail?...` — live tail (SSE or short poll endpoint)
- `GET /api/players` — normalized player count/list from PromQL
- `GET /api/mods` — FS list (+ optional Prom enrichment)
- `GET /api/config/public` — non-secret UI defaults (selector display name, poll intervals)

PromQL / LogQL expressions live server-side (or in config), not hardcoded all over the Vue app.

## Data flow

1. UI mounts → `GET /api/health` → status chips
2. Logs tab → query/tail Loki via API → render lines; live mode refreshes until paused
3. Joueurs tab → `GET /api/players` on interval
4. Mods tab → `GET /api/mods` on load (+ manual refresh)

## Error handling

- Backend down: banner + retry
- Bad selector / no streams: empty state with selector shown
- Mods path unreadable: error with path (permissions)
- Partial degradation allowed (e.g. Logs OK, Prom down)

## Project layout (target)

```
varyon-dashboard/
  package.json
  vite.config.ts
  index.html
  .env.example
  server/                 # Node API (prod + optionally shared with Vite plugin)
  src/
    main.ts
    App.vue
    router/
    styles/
    views/                # LogsView, JoueursView, ModsView
    components/layout/    # Sidebar, StatusBar
    components/logs/
    composables/
    services/             # api client
  docs/superpowers/specs/
```

## Success criteria

- From the Hytale host (or LAN), open the dashboard and see live Varyon server logs from Loki
- Filter by text/level and pause/resume live tail
- See player count (or a clear missing-metric message)
- See installed mods from the server mods directory
- Future tabs visible but not implemented

## Open items (resolve during implementation)

1. Exact Loki stream labels for Varyon (`LOKI_LOG_SELECTOR`)
2. Exact Prometheus metric names for online players / player list
3. Whether Loki tail API or range-query polling is used for live mode (prefer tail if available; fallback poll)

Defaults will be documented in `.env.example` and adjustable without code changes.
