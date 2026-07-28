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
