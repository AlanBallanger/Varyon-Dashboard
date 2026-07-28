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
