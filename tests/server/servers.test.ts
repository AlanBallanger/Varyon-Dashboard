import { describe, it, expect } from 'vitest'
import { isServerAction, parseSystemctlShow, toServerStatus } from '../../server/servers'

describe('parseSystemctlShow', () => {
  it('parses Key=Value lines', () => {
    const stdout = [
      'ActiveState=active',
      'SubState=running',
      'ActiveEnterTimestamp=Wed 2026-07-29 02:49:54 UTC',
    ].join('\n')
    expect(parseSystemctlShow(stdout)).toEqual({
      ActiveState: 'active',
      SubState: 'running',
      ActiveEnterTimestamp: 'Wed 2026-07-29 02:49:54 UTC',
    })
  })

  it('keeps empty values (never-started units)', () => {
    expect(parseSystemctlShow('ActiveEnterTimestamp=')).toEqual({ ActiveEnterTimestamp: '' })
  })

  it('preserves "=" inside values', () => {
    expect(parseSystemctlShow('Foo=a=b')).toEqual({ Foo: 'a=b' })
  })

  it('ignores blank lines', () => {
    expect(parseSystemctlShow('\nActiveState=active\n\n')).toEqual({ ActiveState: 'active' })
  })
})

describe('toServerStatus', () => {
  it('marks an active unit as running', () => {
    const status = toServerStatus('hytale', 'Hytale', 'hytale', {
      ActiveState: 'active',
      SubState: 'running',
      ActiveEnterTimestamp: 'Wed 2026-07-29 02:49:54 UTC',
    })
    expect(status.running).toBe(true)
    expect(status.activeState).toBe('active')
    expect(status.activeSinceMs).toBe(Date.parse('Wed 2026-07-29 02:49:54 UTC'))
  })

  it('marks an inactive unit as stopped', () => {
    const status = toServerStatus('test', 'Test', 'test', {
      ActiveState: 'inactive',
      SubState: 'dead',
      ActiveEnterTimestamp: '',
    })
    expect(status.running).toBe(false)
    expect(status.activeSinceMs).toBeUndefined()
  })

  it('treats a failed unit as not running', () => {
    const status = toServerStatus('hytale', 'Hytale', 'hytale', {
      ActiveState: 'failed',
      SubState: 'failed',
    })
    expect(status.running).toBe(false)
    expect(status.activeState).toBe('failed')
  })

  it('falls back to unknown for missing properties', () => {
    const status = toServerStatus('hytale', 'Hytale', 'hytale', {})
    expect(status.activeState).toBe('unknown')
    expect(status.subState).toBe('unknown')
    expect(status.running).toBe(false)
  })
})

describe('isServerAction', () => {
  it('accepts the three known actions', () => {
    expect(isServerAction('start')).toBe(true)
    expect(isServerAction('stop')).toBe(true)
    expect(isServerAction('restart')).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isServerAction('reboot')).toBe(false)
    expect(isServerAction('stop; rm -rf /')).toBe(false)
    expect(isServerAction('')).toBe(false)
  })
})
