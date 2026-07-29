import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadDotEnvFile(filePath = resolve(process.cwd(), '.env')) {
  if (!existsSync(filePath)) return
  const text = readFileSync(filePath, 'utf8')
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq <= 0) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

loadDotEnvFile()

export type AppEnv = {
  lokiUrl: string
  prometheusUrl: string
  modsPath: string
  lokiLogSelector: string
  apiPort: number
  playersPromql: string
  consoleFifoPath: string
  consoleUnit: string
  logsDir: string
}

export type ServerEnvironment = {
  id: string
  label: string
}

const SHARED = {
  lokiUrl: process.env.LOKI_URL ?? 'http://localhost:3100',
  prometheusUrl: process.env.PROMETHEUS_URL ?? 'http://localhost:9090',
  apiPort: Number(process.env.API_PORT ?? 8787),
}

/** Per-environment config. Loki/Prometheus are shared; only server-specific paths differ. */
const ENVIRONMENTS: Record<string, AppEnv> = {
  hytale: {
    ...SHARED,
    modsPath: process.env.HYTALE_MODS_PATH ?? '/opt/hytale/server/mods',
    lokiLogSelector: process.env.LOKI_LOG_SELECTOR ?? '{job="hytale"}',
    playersPromql: process.env.PLAYERS_PROMQL ?? 'hytale_players_online',
    consoleFifoPath: process.env.CONSOLE_FIFO_PATH ?? '/opt/hytale/server/console.fifo',
    consoleUnit: process.env.CONSOLE_UNIT ?? 'hytale',
    logsDir: process.env.HYTALE_LOGS_DIR ?? '/opt/hytale/server/logs',
  },
  test: {
    ...SHARED,
    modsPath: process.env.TEST_MODS_PATH ?? '/opt/test/server/mods',
    lokiLogSelector: process.env.TEST_LOKI_LOG_SELECTOR ?? '{job="test"}',
    playersPromql: process.env.TEST_PLAYERS_PROMQL ?? 'test_players_online',
    consoleFifoPath: process.env.TEST_CONSOLE_FIFO_PATH ?? '/opt/test/server/console.fifo',
    consoleUnit: process.env.TEST_CONSOLE_UNIT ?? 'test',
    logsDir: process.env.TEST_LOGS_DIR ?? '/opt/test/server/logs',
  },
}

export const DEFAULT_ENVIRONMENT_ID = 'hytale'

export function listEnvironments(): ServerEnvironment[] {
  return [
    { id: 'hytale', label: 'Hytale' },
    { id: 'test', label: 'Test' },
  ]
}

export function resolveEnv(id: string | null | undefined): AppEnv {
  if (id && ENVIRONMENTS[id]) return ENVIRONMENTS[id]
  return ENVIRONMENTS[DEFAULT_ENVIRONMENT_ID]
}
