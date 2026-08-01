import { describe, it, expect } from 'vitest'
import { DEFAULT_ENVIRONMENT_ID, listEnvironments, resolveEnv } from '../../server/env'

// Config is resolved once at import time, so these assert the defaults that ship
// with the module rather than reacting to process.env mutations here.

describe('listEnvironments', () => {
  it('exposes the hytale and test environments', () => {
    expect(listEnvironments().map((e) => e.id)).toEqual(['hytale', 'test'])
  })

  it('gives every environment a label', () => {
    for (const env of listEnvironments()) {
      expect(env.label).toBeTruthy()
    }
  })
})

describe('resolveEnv', () => {
  it('returns the hytale defaults', () => {
    const env = resolveEnv('hytale')
    expect(env.lokiUrl).toBe('http://localhost:3100')
    expect(env.prometheusUrl).toBe('http://localhost:9090')
    expect(env.modsPath).toBe('/opt/hytale/server/mods')
    expect(env.lokiLogSelector).toBe('{job="hytale"}')
    expect(env.apiPort).toBe(8787)
    expect(env.playersPromql).toBe('hytale_players_online')
    expect(env.consoleUnit).toBe('hytale')
  })

  it('returns a distinct config for the test environment', () => {
    const env = resolveEnv('test')
    expect(env.lokiLogSelector).toBe('{job="test"}')
    expect(env.consoleUnit).toBe('hytale-test')
    expect(env.logsDir).toBe('/opt/hytale/test/logs')
    expect(env.consoleFifoPath).not.toBe(resolveEnv('hytale').consoleFifoPath)
  })

  it('shares Loki and Prometheus across environments', () => {
    expect(resolveEnv('test').lokiUrl).toBe(resolveEnv('hytale').lokiUrl)
    expect(resolveEnv('test').apiPort).toBe(resolveEnv('hytale').apiPort)
  })

  it('falls back to the default environment for unknown or missing ids', () => {
    const fallback = resolveEnv(DEFAULT_ENVIRONMENT_ID)
    expect(resolveEnv('nope')).toBe(fallback)
    expect(resolveEnv(null)).toBe(fallback)
    expect(resolveEnv(undefined)).toBe(fallback)
  })
})
