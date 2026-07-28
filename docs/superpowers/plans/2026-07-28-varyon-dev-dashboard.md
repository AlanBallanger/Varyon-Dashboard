# Varyon Dev Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vue 3 + Vite dark ops dashboard that shows Hytale Varyon logs (Loki), players (Prometheus), and mods (filesystem), via a thin Node API.

**Architecture:** Browser SPA talks only to a colocated Node API. The API proxies Loki (LogQL) and Prometheus (PromQL) and lists `/opt/hytale/server/mods`. Live logs use Loki query_range polling as V1 (simple, reliable); SSE/tail can replace later.

**Tech Stack:** Vue 3, TypeScript, Vite 6, Vue Router 4, Tailwind CSS 3, DaisyUI 5, @tabler/icons-vue, pnpm, Node (native `http` + no Express required), Vitest.

## Global Constraints

- Web only — no Tauri, no Rust
- French UI copy, dark ops theme
- No auth in V1
- No Pinia; no vue-i18n (hardcoded FR)
- Config via env: `LOKI_URL`, `PROMETHEUS_URL`, `HYTALE_MODS_PATH`, `LOKI_LOG_SELECTOR`, `API_PORT`, optional `PLAYERS_PROMQL`
- Tabler icons: named imports from `@tabler/icons-vue`
- Future tabs (Console, TPS, RAM, CPU, Spark, Threads, World Save, Scheduler) appear disabled with label “bientôt”
- Package manager: pnpm

---

## File structure

```
varyon-dashboard/
  package.json
  pnpm-lock.yaml
  vite.config.ts
  tsconfig.json
  tsconfig.node.json
  index.html
  .env.example
  .gitignore
  postcss.config.js
  tailwind.config.js
  server/
    index.ts              # HTTP server entry (API_PORT)
    env.ts                # env loading + defaults
    health.ts             # Loki/Prom readiness
    loki.ts               # LogQL query_range + normalize
    prometheus.ts         # PromQL instant query helper
    players.ts            # normalize players response
    mods.ts               # FS list under HYTALE_MODS_PATH
    types.ts              # shared API types
  src/
    main.ts
    App.vue
    env.d.ts
    router/index.ts
    styles/index.css
    services/api.ts
    types/api.ts
    composables/useHealth.ts
    composables/useLogs.ts
    composables/usePlayers.ts
    composables/useMods.ts
    components/layout/Sidebar.vue
    components/layout/StatusBar.vue
    components/layout/AppShell.vue
    components/logs/LogFilters.vue
    components/logs/LogViewer.vue
    components/logs/LogLine.vue
    views/LogsView.vue
    views/JoueursView.vue
    views/ModsView.vue
    views/PlaceholderView.vue
  tests/
    server/env.test.ts
    server/loki.test.ts
    server/players.test.ts
    server/mods.test.ts
  docs/superpowers/specs/2026-07-28-varyon-dev-dashboard-design.md
  docs/superpowers/plans/2026-07-28-varyon-dev-dashboard.md
```

---

### Task 1: Scaffold frontend + tooling

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `.gitignore`, `.env.example`, `postcss.config.js`, `tailwind.config.js`, `src/main.ts`, `src/App.vue`, `src/env.d.ts`, `src/styles/index.css`, `src/router/index.ts`, `src/views/LogsView.vue` (stub)

**Interfaces:**
- Consumes: nothing
- Produces: runnable `pnpm dev` Vite app on `:5173` with dark DaisyUI theme; path alias `@` → `src`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "varyon-dashboard",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10.8.1",
  "scripts": {
    "dev": "vite",
    "dev:api": "tsx watch server/index.ts",
    "dev:all": "pnpm dev:api & pnpm dev",
    "build": "vue-tsc --noEmit && vite build",
    "preview": "vite preview",
    "start": "tsx server/index.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@tabler/icons-vue": "^3.34.0",
    "vue": "^3.5.13",
    "vue-router": "^4.5.1"
  },
  "devDependencies": {
    "@tailwindcss/typography": "^0.5.16",
    "@vitejs/plugin-vue": "^5.2.3",
    "autoprefixer": "^10.4.21",
    "daisyui": "^5.0.43",
    "postcss": "^8.5.4",
    "tailwindcss": "^3.4.0",
    "tsx": "^4.19.0",
    "typescript": "^5.8.3",
    "vite": "^6.3.3",
    "vitest": "^3.0.0",
    "vue-tsc": "^2.2.10"
  }
}
```

- [ ] **Step 2: Create Vite / TS / Tailwind config files**

`vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
```

`tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui'), require('@tailwindcss/typography')],
  daisyui: {
    themes: ['dark'],
  },
}
```

`postcss.config.js`:

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "lib": ["ESNext", "DOM"],
    "skipLibCheck": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "types": ["vite/client"]
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue", "server/**/*.ts", "tests/**/*.ts"]
}
```

`tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
```

`.gitignore`:

```
node_modules
dist
.env
*.local
.DS_Store
```

`.env.example`:

```env
LOKI_URL=http://localhost:3100
PROMETHEUS_URL=http://localhost:9090
HYTALE_MODS_PATH=/opt/hytale/server/mods
LOKI_LOG_SELECTOR={job="hytale"}
API_PORT=8787
PLAYERS_PROMQL=hytale_players_online
```

- [ ] **Step 3: Create minimal Vue entry**

`index.html`:

```html
<!doctype html>
<html lang="fr" data-theme="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Varyon Dev Dashboard</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

`src/styles/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #app {
  height: 100%;
}
```

`src/env.d.ts`:

```ts
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
```

`src/main.ts`:

```ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/index.css'

createApp(App).use(router).mount('#app')
```

`src/App.vue`:

```vue
<template>
  <router-view />
</template>
```

`src/router/index.ts`:

```ts
import { createRouter, createWebHistory } from 'vue-router'
import LogsView from '@/views/LogsView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/logs' },
    { path: '/logs', name: 'logs', component: LogsView },
  ],
})

export default router
```

`src/views/LogsView.vue` (stub):

```vue
<template>
  <div class="p-6 text-base-content">
    <h1 class="text-2xl font-semibold">Varyon Dev Dashboard</h1>
    <p class="opacity-70 mt-2">Scaffold OK — Logs à venir</p>
  </div>
</template>
```

- [ ] **Step 4: Install and verify**

Run: `pnpm install`
Run: `pnpm exec vite build` (or `pnpm build` after vue-tsc is happy)
Expected: dependencies install; app builds (or at least `pnpm dev` serves the stub page)

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml vite.config.ts tsconfig.json tsconfig.node.json index.html .gitignore .env.example postcss.config.js tailwind.config.js src
git commit -m "chore: scaffold Vue Vite dashboard with Tailwind and DaisyUI"
```

---

### Task 2: Server env + shared API types + Vitest

**Files:**
- Create: `server/env.ts`, `server/types.ts`, `tests/server/env.test.ts`

**Interfaces:**
- Consumes: process env / `.env` via `process.env` (load with Node only; document that `.env` is exported by shell or use `tsx` + manual read — prefer reading `.env` file if present)
- Produces:
  - `loadEnv(): AppEnv`
  - `AppEnv`: `{ lokiUrl, prometheusUrl, modsPath, lokiLogSelector, apiPort, playersPromql }`
  - Shared response types in `server/types.ts`

- [ ] **Step 1: Write failing env test**

`tests/server/env.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { loadEnv } from '../../server/env'

const KEYS = [
  'LOKI_URL',
  'PROMETHEUS_URL',
  'HYTALE_MODS_PATH',
  'LOKI_LOG_SELECTOR',
  'API_PORT',
  'PLAYERS_PROMQL',
] as const

describe('loadEnv', () => {
  const backup: Record<string, string | undefined> = {}

  beforeEach(() => {
    for (const k of KEYS) {
      backup[k] = process.env[k]
      delete process.env[k]
    }
  })

  afterEach(() => {
    for (const k of KEYS) {
      if (backup[k] === undefined) delete process.env[k]
      else process.env[k] = backup[k]
    }
  })

  it('returns defaults when env is empty', () => {
    const env = loadEnv()
    expect(env.lokiUrl).toBe('http://localhost:3100')
    expect(env.prometheusUrl).toBe('http://localhost:9090')
    expect(env.modsPath).toBe('/opt/hytale/server/mods')
    expect(env.lokiLogSelector).toBe('{job="hytale"}')
    expect(env.apiPort).toBe(8787)
    expect(env.playersPromql).toBe('hytale_players_online')
  })

  it('reads overrides from process.env', () => {
    process.env.LOKI_URL = 'http://loki:3100'
    process.env.API_PORT = '9000'
    process.env.LOKI_LOG_SELECTOR = '{job="varyon"}'
    const env = loadEnv()
    expect(env.lokiUrl).toBe('http://loki:3100')
    expect(env.apiPort).toBe(9000)
    expect(env.lokiLogSelector).toBe('{job="varyon"}')
  })
})
```

- [ ] **Step 2: Run test — expect fail**

Run: `pnpm test -- tests/server/env.test.ts`
Expected: FAIL — cannot resolve `../../server/env`

- [ ] **Step 3: Implement `server/types.ts` and `server/env.ts`**

`server/types.ts`:

```ts
export type HealthStatus = {
  loki: { ok: boolean; detail?: string }
  prometheus: { ok: boolean; detail?: string }
}

export type LogLevel = 'ALL' | 'INFO' | 'WARN' | 'ERROR'

export type LogLine = {
  ts: string
  line: string
  level: Exclude<LogLevel, 'ALL'> | 'UNKNOWN'
  labels: Record<string, string>
}

export type LogsQueryResponse = {
  lines: LogLine[]
  selector: string
}

export type PlayerInfo = {
  name: string
  labels: Record<string, string>
}

export type PlayersResponse = {
  count: number
  players: PlayerInfo[]
  metric: string
  missingMetric: boolean
}

export type ModInfo = {
  name: string
  path: string
  kind: 'file' | 'directory'
  sizeBytes?: number
}

export type ModsResponse = {
  mods: ModInfo[]
  path: string
}

export type PublicConfig = {
  lokiLogSelector: string
  playersPollMs: number
  logsPollMs: number
}
```

`server/env.ts`:

```ts
export type AppEnv = {
  lokiUrl: string
  prometheusUrl: string
  modsPath: string
  lokiLogSelector: string
  apiPort: number
  playersPromql: string
}

export function loadEnv(): AppEnv {
  return {
    lokiUrl: process.env.LOKI_URL ?? 'http://localhost:3100',
    prometheusUrl: process.env.PROMETHEUS_URL ?? 'http://localhost:9090',
    modsPath: process.env.HYTALE_MODS_PATH ?? '/opt/hytale/server/mods',
    lokiLogSelector: process.env.LOKI_LOG_SELECTOR ?? '{job="hytale"}',
    apiPort: Number(process.env.API_PORT ?? 8787),
    playersPromql: process.env.PLAYERS_PROMQL ?? 'hytale_players_online',
  }
}
```

- [ ] **Step 4: Run test — expect pass**

Run: `pnpm test -- tests/server/env.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/env.ts server/types.ts tests/server/env.test.ts
git commit -m "feat: add server env loader and shared API types"
```

---

### Task 3: Loki client (query_range normalize)

**Files:**
- Create: `server/loki.ts`, `tests/server/loki.test.ts`

**Interfaces:**
- Consumes: `AppEnv.lokiUrl`, `AppEnv.lokiLogSelector`
- Produces:
  - `buildLogQL(selector: string, filter?: string, level?: LogLevel): string`
  - `detectLevel(line: string): LogLine['level']`
  - `normalizeLokiMatrix(data: unknown): LogLine[]`
  - `queryLokiLogs(opts): Promise<LogsQueryResponse>`

- [ ] **Step 1: Write failing tests**

`tests/server/loki.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildLogQL, detectLevel, normalizeLokiMatrix } from '../../server/loki'

describe('buildLogQL', () => {
  it('uses selector alone', () => {
    expect(buildLogQL('{job="hytale"}')).toBe('{job="hytale"}')
  })

  it('appends text filter', () => {
    expect(buildLogQL('{job="hytale"}', 'connected')).toBe('{job="hytale"} |= "connected"')
  })

  it('appends level filter for ERROR', () => {
    expect(buildLogQL('{job="hytale"}', undefined, 'ERROR')).toBe('{job="hytale"} |~ "(?i)error"')
  })
})

describe('detectLevel', () => {
  it('detects ERROR/WARN/INFO', () => {
    expect(detectLevel('[ERROR] boom')).toBe('ERROR')
    expect(detectLevel('WARN something')).toBe('WARN')
    expect(detectLevel('INFO hello')).toBe('INFO')
    expect(detectLevel('plain')).toBe('UNKNOWN')
  })
})

describe('normalizeLokiMatrix', () => {
  it('flattens streams into sorted lines', () => {
    const data = {
      status: 'success',
      data: {
        resultType: 'streams',
        result: [
          {
            stream: { job: 'hytale' },
            values: [
              ['1700000001000000000', 'INFO a'],
              ['1700000003000000000', 'ERROR b'],
            ],
          },
        ],
      },
    }
    const lines = normalizeLokiMatrix(data)
    expect(lines).toHaveLength(2)
    expect(lines[0].line).toBe('INFO a')
    expect(lines[1].line).toBe('ERROR b')
    expect(lines[1].level).toBe('ERROR')
  })
})
```

- [ ] **Step 2: Run test — expect fail**

Run: `pnpm test -- tests/server/loki.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `server/loki.ts`**

```ts
import type { AppEnv } from './env'
import type { LogLevel, LogLine, LogsQueryResponse } from './types'

export function buildLogQL(
  selector: string,
  filter?: string,
  level: LogLevel = 'ALL',
): string {
  let q = selector.trim()
  if (filter?.trim()) {
    const escaped = filter.trim().replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    q += ` |= "${escaped}"`
  }
  if (level !== 'ALL') {
    q += ` |~ "(?i)${level}"`
  }
  return q
}

export function detectLevel(line: string): LogLine['level'] {
  if (/\bERROR\b/i.test(line)) return 'ERROR'
  if (/\bWARN(ING)?\b/i.test(line)) return 'WARN'
  if (/\bINFO\b/i.test(line)) return 'INFO'
  return 'UNKNOWN'
}

export function normalizeLokiMatrix(payload: unknown): LogLine[] {
  const root = payload as {
    data?: { result?: Array<{ stream?: Record<string, string>; values?: string[][] }> }
  }
  const result = root.data?.result ?? []
  const lines: LogLine[] = []
  for (const stream of result) {
    const labels = stream.stream ?? {}
    for (const pair of stream.values ?? []) {
      const [ns, line] = pair
      const ms = Math.floor(Number(ns) / 1_000_000)
      lines.push({
        ts: new Date(ms).toISOString(),
        line,
        level: detectLevel(line),
        labels,
      })
    }
  }
  lines.sort((a, b) => a.ts.localeCompare(b.ts))
  return lines
}

export async function queryLokiLogs(
  env: AppEnv,
  opts: {
    startMs: number
    endMs: number
    limit?: number
    filter?: string
    level?: LogLevel
  },
): Promise<LogsQueryResponse> {
  const selector = env.lokiLogSelector
  const query = buildLogQL(selector, opts.filter, opts.level ?? 'ALL')
  const params = new URLSearchParams({
    query,
    start: String(opts.startMs * 1_000_000),
    end: String(opts.endMs * 1_000_000),
    limit: String(opts.limit ?? 500),
    direction: 'forward',
  })
  const url = `${env.lokiUrl.replace(/\/$/, '')}/loki/api/v1/query_range?${params}`
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Loki ${res.status}: ${body}`)
  }
  const json = await res.json()
  return { lines: normalizeLokiMatrix(json), selector }
}
```

- [ ] **Step 4: Run test — expect pass**

Run: `pnpm test -- tests/server/loki.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/loki.ts tests/server/loki.test.ts
git commit -m "feat: add Loki LogQL builder and log normalizer"
```

---

### Task 4: Prometheus helper + players + mods

**Files:**
- Create: `server/prometheus.ts`, `server/players.ts`, `server/mods.ts`, `server/health.ts`, `tests/server/players.test.ts`, `tests/server/mods.test.ts`

**Interfaces:**
- Consumes: `AppEnv`, Node `fs/promises`
- Produces:
  - `promQuery(env, query): Promise<unknown>`
  - `getPlayers(env): Promise<PlayersResponse>`
  - `listMods(env): Promise<ModsResponse>`
  - `getHealth(env): Promise<HealthStatus>`

- [ ] **Step 1: Write failing players + mods tests**

`tests/server/players.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { normalizePlayersPayload } from '../../server/players'

describe('normalizePlayersPayload', () => {
  it('marks missing metric when result empty', () => {
    const r = normalizePlayersPayload(
      { data: { resultType: 'vector', result: [] } },
      'hytale_players_online',
    )
    expect(r.missingMetric).toBe(true)
    expect(r.count).toBe(0)
    expect(r.players).toEqual([])
  })

  it('reads gauge value and player labels', () => {
    const r = normalizePlayersPayload(
      {
        data: {
          resultType: 'vector',
          result: [
            {
              metric: { __name__: 'hytale_players_online', player: 'Alex' },
              value: [1700000000, '1'],
            },
            {
              metric: { __name__: 'hytale_players_online', player: 'Sam' },
              value: [1700000000, '1'],
            },
          ],
        },
      },
      'hytale_players_online',
    )
    expect(r.missingMetric).toBe(false)
    expect(r.count).toBe(2)
    expect(r.players.map((p) => p.name).sort()).toEqual(['Alex', 'Sam'])
  })

  it('uses scalar count when no player label', () => {
    const r = normalizePlayersPayload(
      {
        data: {
          resultType: 'vector',
          result: [{ metric: { __name__: 'hytale_players_online' }, value: [1, '3'] }],
        },
      },
      'hytale_players_online',
    )
    expect(r.count).toBe(3)
    expect(r.players).toEqual([])
  })
})
```

`tests/server/mods.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { listModsFromPath } from '../../server/mods'

describe('listModsFromPath', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'varyon-mods-'))
    await writeFile(join(dir, 'Foo.jar'), 'x')
    await mkdir(join(dir, 'BarMod'))
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('lists jars and directories', async () => {
    const res = await listModsFromPath(dir)
    expect(res.path).toBe(dir)
    expect(res.mods.map((m) => m.name).sort()).toEqual(['BarMod', 'Foo.jar'])
  })
})
```

- [ ] **Step 2: Run tests — expect fail**

Run: `pnpm test -- tests/server/players.test.ts tests/server/mods.test.ts`
Expected: FAIL — modules missing

- [ ] **Step 3: Implement prometheus, players, mods, health**

`server/prometheus.ts`:

```ts
import type { AppEnv } from './env'

export async function promQuery(env: AppEnv, query: string): Promise<unknown> {
  const params = new URLSearchParams({ query })
  const url = `${env.prometheusUrl.replace(/\/$/, '')}/api/v1/query?${params}`
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Prometheus ${res.status}: ${body}`)
  }
  return res.json()
}
```

`server/players.ts`:

```ts
import type { AppEnv } from './env'
import type { PlayerInfo, PlayersResponse } from './types'
import { promQuery } from './prometheus'

export function normalizePlayersPayload(payload: unknown, metric: string): PlayersResponse {
  const root = payload as {
    data?: { result?: Array<{ metric?: Record<string, string>; value?: [number, string] }> }
  }
  const result = root.data?.result ?? []
  if (result.length === 0) {
    return { count: 0, players: [], metric, missingMetric: true }
  }

  const players: PlayerInfo[] = []
  for (const sample of result) {
    const labels = sample.metric ?? {}
    const name = labels.player ?? labels.name ?? labels.username
    if (name) {
      players.push({ name, labels })
    }
  }

  if (players.length > 0) {
    return { count: players.length, players, metric, missingMetric: false }
  }

  const raw = result[0]?.value?.[1]
  const count = Number(raw ?? 0)
  return {
    count: Number.isFinite(count) ? count : 0,
    players: [],
    metric,
    missingMetric: false,
  }
}

export async function getPlayers(env: AppEnv): Promise<PlayersResponse> {
  const payload = await promQuery(env, env.playersPromql)
  return normalizePlayersPayload(payload, env.playersPromql)
}
```

`server/mods.ts`:

```ts
import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import type { AppEnv } from './env'
import type { ModInfo, ModsResponse } from './types'

export async function listModsFromPath(modsPath: string): Promise<ModsResponse> {
  const entries = await readdir(modsPath, { withFileTypes: true })
  const mods: ModInfo[] = []
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const full = join(modsPath, entry.name)
    if (entry.isDirectory()) {
      mods.push({ name: entry.name, path: full, kind: 'directory' })
      continue
    }
    if (entry.isFile()) {
      const s = await stat(full)
      mods.push({ name: entry.name, path: full, kind: 'file', sizeBytes: s.size })
    }
  }
  mods.sort((a, b) => a.name.localeCompare(b.name))
  return { mods, path: modsPath }
}

export async function listMods(env: AppEnv): Promise<ModsResponse> {
  return listModsFromPath(env.modsPath)
}
```

`server/health.ts`:

```ts
import type { AppEnv } from './env'
import type { HealthStatus } from './types'

async function ping(url: string): Promise<{ ok: boolean; detail?: string }> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` }
    return { ok: true }
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : String(e) }
  }
}

export async function getHealth(env: AppEnv): Promise<HealthStatus> {
  const [loki, prometheus] = await Promise.all([
    ping(`${env.lokiUrl.replace(/\/$/, '')}/ready`),
    ping(`${env.prometheusUrl.replace(/\/$/, '')}/-/ready`),
  ])
  return { loki, prometheus }
}
```

- [ ] **Step 4: Run tests — expect pass**

Run: `pnpm test -- tests/server/players.test.ts tests/server/mods.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/prometheus.ts server/players.ts server/mods.ts server/health.ts tests/server/players.test.ts tests/server/mods.test.ts
git commit -m "feat: add Prometheus players, mods listing, and health checks"
```

---

### Task 5: HTTP API server

**Files:**
- Create: `server/index.ts`

**Interfaces:**
- Consumes: all server modules above
- Produces: HTTP server on `AppEnv.apiPort` with routes:
  - `GET /api/health`
  - `GET /api/logs/query?start&end&limit&filter&level`
  - `GET /api/players`
  - `GET /api/mods`
  - `GET /api/config/public`
  - CORS not required when using Vite proxy; still set JSON content-type
  - Serves `dist/` statically when `NODE_ENV=production` and `dist` exists

- [ ] **Step 1: Implement `server/index.ts`**

```ts
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { loadEnv } from './env'
import { getHealth } from './health'
import { queryLokiLogs } from './loki'
import { getPlayers } from './players'
import { listMods } from './mods'
import type { LogLevel, PublicConfig } from './types'

const env = loadEnv()

function sendJson(res: import('node:http').ServerResponse, status: number, body: unknown) {
  const data = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  res.end(data)
}

function sendError(res: import('node:http').ServerResponse, status: number, message: string) {
  sendJson(res, status, { error: message })
}

async function parseUrl(reqUrl: string | undefined) {
  return new URL(reqUrl ?? '/', `http://127.0.0.1:${env.apiPort}`)
}

const server = createServer(async (req, res) => {
  try {
    const url = await parseUrl(req.url)
    if (req.method === 'GET' && url.pathname === '/api/health') {
      return sendJson(res, 200, await getHealth(env))
    }
    if (req.method === 'GET' && url.pathname === '/api/config/public') {
      const cfg: PublicConfig = {
        lokiLogSelector: env.lokiLogSelector,
        playersPollMs: 5000,
        logsPollMs: 2000,
      }
      return sendJson(res, 200, cfg)
    }
    if (req.method === 'GET' && url.pathname === '/api/logs/query') {
      const start = Number(url.searchParams.get('start') ?? Date.now() - 15 * 60_000)
      const end = Number(url.searchParams.get('end') ?? Date.now())
      const limit = Number(url.searchParams.get('limit') ?? 500)
      const filter = url.searchParams.get('filter') ?? undefined
      const level = (url.searchParams.get('level') as LogLevel | null) ?? 'ALL'
      const result = await queryLokiLogs(env, { startMs: start, endMs: end, limit, filter, level })
      return sendJson(res, 200, result)
    }
    if (req.method === 'GET' && url.pathname === '/api/players') {
      return sendJson(res, 200, await getPlayers(env))
    }
    if (req.method === 'GET' && url.pathname === '/api/mods') {
      return sendJson(res, 200, await listMods(env))
    }

    // optional static for production
    if (req.method === 'GET' && !url.pathname.startsWith('/api')) {
      const dist = join(process.cwd(), 'dist')
      const path = url.pathname === '/' ? '/index.html' : url.pathname
      try {
        const file = join(dist, path)
        const buf = await readFile(file)
        const types: Record<string, string> = {
          '.html': 'text/html',
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.svg': 'image/svg+xml',
        }
        res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' })
        return res.end(buf)
      } catch {
        try {
          const buf = await readFile(join(dist, 'index.html'))
          res.writeHead(200, { 'Content-Type': 'text/html' })
          return res.end(buf)
        } catch {
          /* fallthrough */
        }
      }
    }

    sendError(res, 404, 'Not found')
  } catch (e) {
    sendError(res, 500, e instanceof Error ? e.message : String(e))
  }
})

server.listen(env.apiPort, '0.0.0.0', () => {
  console.log(`Varyon API listening on http://0.0.0.0:${env.apiPort}`)
})
```

- [ ] **Step 2: Smoke-check API**

Run: `pnpm dev:api` (background)
Run: `curl -s http://127.0.0.1:8787/api/config/public`
Expected: JSON with `lokiLogSelector`, poll intervals

Run: `curl -s http://127.0.0.1:8787/api/health`
Expected: JSON with loki/prometheus ok flags (may be false if services down — still 200)

- [ ] **Step 3: Commit**

```bash
git add server/index.ts
git commit -m "feat: add Node HTTP API for health, logs, players, mods"
```

---

### Task 6: Frontend API client + layout shell

**Files:**
- Create: `src/types/api.ts`, `src/services/api.ts`, `src/composables/useHealth.ts`, `src/components/layout/Sidebar.vue`, `src/components/layout/StatusBar.vue`, `src/components/layout/AppShell.vue`, `src/views/PlaceholderView.vue`
- Modify: `src/App.vue`, `src/router/index.ts`

**Interfaces:**
- Consumes: `/api/*` JSON shapes matching `server/types.ts`
- Produces: `api.getHealth()`, `api.getLogsQuery()`, `api.getPlayers()`, `api.getMods()`, `api.getPublicConfig()`; shell with sidebar + status

- [ ] **Step 1: Add `src/types/api.ts` and `src/services/api.ts`**

Mirror server types in `src/types/api.ts` (same shapes as `server/types.ts`).

`src/services/api.ts`:

```ts
import type {
  HealthStatus,
  LogsQueryResponse,
  LogLevel,
  PlayersResponse,
  ModsResponse,
  PublicConfig,
} from '@/types/api'

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(body || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  getHealth: () => getJson<HealthStatus>('/api/health'),
  getPublicConfig: () => getJson<PublicConfig>('/api/config/public'),
  getPlayers: () => getJson<PlayersResponse>('/api/players'),
  getMods: () => getJson<ModsResponse>('/api/mods'),
  getLogsQuery: (q: {
    start: number
    end: number
    limit?: number
    filter?: string
    level?: LogLevel
  }) => {
    const params = new URLSearchParams({
      start: String(q.start),
      end: String(q.end),
      limit: String(q.limit ?? 500),
      level: q.level ?? 'ALL',
    })
    if (q.filter) params.set('filter', q.filter)
    return getJson<LogsQueryResponse>(`/api/logs/query?${params}`)
  },
}
```

- [ ] **Step 2: Implement layout components**

`Sidebar.vue`: brand “Varyon”, nav links for Logs / Joueurs / Mods (router-link), disabled items for future tabs with “bientôt”. Use Tabler icons (`IconFileText`, `IconUsers`, `IconPuzzle`, etc.).

`StatusBar.vue`: chips Loki / Prometheus from `useHealth` (poll every 10s).

`AppShell.vue`: sidebar + status + `<router-view />`.

`PlaceholderView.vue`: “Bientôt disponible”.

`useHealth.ts`:

```ts
import { onMounted, onUnmounted, ref } from 'vue'
import { api } from '@/services/api'
import type { HealthStatus } from '@/types/api'

export function useHealth(pollMs = 10_000) {
  const health = ref<HealthStatus | null>(null)
  const error = ref<string | null>(null)
  let timer: ReturnType<typeof setInterval> | undefined

  async function refresh() {
    try {
      health.value = await api.getHealth()
      error.value = null
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    }
  }

  onMounted(() => {
    void refresh()
    timer = setInterval(() => void refresh(), pollMs)
  })
  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return { health, error, refresh }
}
```

- [ ] **Step 3: Wire router + App**

Routes:

- `/logs` → LogsView
- `/joueurs` → JoueursView (stub ok until Task 8)
- `/mods` → ModsView (stub ok until Task 9)
- `/console`, `/tps`, `/ram`, `/cpu`, `/spark`, `/threads`, `/world-save`, `/scheduler` → PlaceholderView

`App.vue` wraps with `AppShell`.

- [ ] **Step 4: Visual check**

Run: `pnpm dev:api` + `pnpm dev`
Open: `http://localhost:5173/logs`
Expected: dark shell, sidebar, status chips (likely red if Loki/Prom down)

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: add API client and dark app shell with sidebar"
```

---

### Task 7: Logs view (live poll)

**Files:**
- Create: `src/composables/useLogs.ts`, `src/components/logs/LogFilters.vue`, `src/components/logs/LogLine.vue`, `src/components/logs/LogViewer.vue`
- Modify: `src/views/LogsView.vue`

**Interfaces:**
- Consumes: `api.getLogsQuery`, `api.getPublicConfig`
- Produces: live-updating log list with filter/level/pause/auto-scroll

- [ ] **Step 1: Implement `useLogs`**

Behavior:

- Default window: last 15 minutes
- Live mode: every `logsPollMs` (from config, default 2000), query `end=now`, keep merging unique lines by `${ts}|${line}`
- `paused` stops polling
- Expose: `lines`, `filter`, `level`, `live`, `paused`, `error`, `loading`, `selector`, controls

- [ ] **Step 2: Build filter + viewer components**

`LogFilters.vue`: text input, level select (ALL/INFO/WARN/ERROR), toggle Live, button Pause/Resume, button Clear filter.

`LogLine.vue`: monospace row; color by level (`ERROR` red, `WARN` yellow, `INFO` muted, else default).

`LogViewer.vue`: scroll container; auto-scroll to bottom unless user scrolled up or paused; empty/error states in French.

- [ ] **Step 3: Assemble `LogsView.vue`**

Title “Logs”, show active selector, filters, viewer.

- [ ] **Step 4: Manual test**

With Loki up and correct `LOKI_LOG_SELECTOR`: lines appear and live-update.  
With Loki down: error banner with message, retry still polls when live.

- [ ] **Step 5: Commit**

```bash
git add src/composables/useLogs.ts src/components/logs src/views/LogsView.vue
git commit -m "feat: add Loki logs viewer with live polling"
```

---

### Task 8: Joueurs view

**Files:**
- Create: `src/composables/usePlayers.ts`, `src/views/JoueursView.vue` (replace stub)

**Interfaces:**
- Consumes: `api.getPlayers`, `api.getPublicConfig.playersPollMs`
- Produces: count + list; explicit missing-metric message showing `PLAYERS_PROMQL` / `metric` field

- [ ] **Step 1: Implement `usePlayers`** — poll every 5s; expose `data`, `error`, `refresh`

- [ ] **Step 2: Implement `JoueursView.vue`**

- Big count
- Table/list of player names when present
- If `missingMetric`: alert “Métrique introuvable: `{metric}`. Vérifie PLAYERS_PROMQL / Prometheus.”

- [ ] **Step 3: Manual test** against Prometheus (or confirm missing-metric UI)

- [ ] **Step 4: Commit**

```bash
git add src/composables/usePlayers.ts src/views/JoueursView.vue
git commit -m "feat: add players view backed by Prometheus"
```

---

### Task 9: Mods view + README

**Files:**
- Create: `src/composables/useMods.ts`, `src/views/ModsView.vue`, `README.md`
- Modify: none else required

**Interfaces:**
- Consumes: `api.getMods`
- Produces: table name / kind / size; refresh button; path error shown if API 500

- [ ] **Step 1: Implement mods composable + view**

- [ ] **Step 2: Write `README.md`**

Include:

- What it is
- Env vars from `.env.example`
- Dev: `pnpm install`, copy `.env.example` → `.env`, `pnpm dev:api`, `pnpm dev`
- Prod: `pnpm build`, `pnpm start` (API serves `dist`)
- Note: adjust `LOKI_LOG_SELECTOR` and `PLAYERS_PROMQL` to real labels/metrics

- [ ] **Step 3: Full verification**

Run: `pnpm test` — all unit tests pass  
Run: `pnpm build` — succeeds  
Manual: Logs / Joueurs / Mods routes work; placeholders visible disabled or via routes

- [ ] **Step 4: Commit**

```bash
git add src/composables/useMods.ts src/views/ModsView.vue README.md
git commit -m "feat: add mods view and project README"
```

---

## Spec coverage self-review

| Spec requirement | Task |
|------------------|------|
| Vue/Vite/TS/Tailwind/DaisyUI/Tabler | 1, 6 |
| Node API proxy Loki/Prom/FS | 3–5 |
| Logs live + filters + levels | 7 |
| Joueurs PromQL + missing metric UX | 4, 8 |
| Mods FS list | 4, 9 |
| Health chips | 5, 6 |
| Dark FR UI, no auth | 1, 6–9 |
| Future tabs placeholder | 6 |
| `.env` config | 1, 2 |
| Success criteria | 7–9 verification steps |

Open items from spec (selector / metric names / tail vs poll): resolved as **env-configurable selector/metric** + **query_range polling** for V1 live logs.

## Placeholder scan

No TBD/TODO left in tasks; live mode explicitly uses polling (not vague “prefer tail”).

## Type consistency

Shared shapes: `LogLine`, `LogsQueryResponse`, `PlayersResponse`, `ModsResponse`, `HealthStatus`, `PublicConfig` — mirrored in `server/types.ts` and `src/types/api.ts`.
