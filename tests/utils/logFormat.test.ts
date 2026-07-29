import { describe, it, expect } from 'vitest'
import { formatLogLine, tagHue } from '../../src/utils/logFormat'

describe('formatLogLine', () => {
  it('strips the timestamp prefix and extracts the tag', () => {
    const { tag, message } = formatLogLine(
      '[2026/07/29 03:42:07   INFO]         [InventoryManager] Auto-save: 1 file(s) written',
    )
    expect(tag).toBe('InventoryManager')
    expect(message).toBe('Auto-save: 1 file(s) written')
  })

  it('drops the |P suffix', () => {
    const { tag, message } = formatLogLine(
      '[2026/07/29 03:41:47   INFO]            [ModProfiler|P] ModProfiler 0h 51m',
    )
    expect(tag).toBe('ModProfiler')
    expect(message).toBe('ModProfiler 0h 51m')
  })

  it('skips channel tags in favour of the mod tag', () => {
    const { tag, message } = formatLogLine(
      '[2026/07/29 03:40:52   INFO]  [SOUT] [FantasticPerformanceSaver] Report: Spieler=1',
    )
    expect(tag).toBe('FantasticPerformanceSaver')
    expect(message).toBe('Report: Spieler=1')
  })

  it('returns no tag for stack trace lines', () => {
    const { tag, message } = formatLogLine(
      '\tat com.hypixel.hytale.server.core.HytaleServer.boot(HytaleServer.java:398)',
    )
    expect(tag).toBeNull()
    expect(message).toBe('\tat com.hypixel.hytale.server.core.HytaleServer.boot(HytaleServer.java:398)')
  })

  it('returns no tag for a bare "Caused by:" line', () => {
    const { tag } = formatLogLine('Caused by: java.lang.IllegalArgumentException: bad range')
    expect(tag).toBeNull()
  })

  it('handles an empty line', () => {
    expect(formatLogLine('')).toEqual({ tag: null, message: '' })
  })

  it('handles a prefix with no tag after it', () => {
    const { tag, message } = formatLogLine('[2026/07/29 03:49:25   INFO] plain message')
    expect(tag).toBeNull()
    expect(message).toBe('plain message')
  })

  it('shortens fully-qualified logger names', () => {
    const { tag } = formatLogLine('[2026/07/29 03:45:16   INFO] [com.electro.HyCitizens] ready')
    expect(tag).toBe('HyCitizens')
  })

  it('keeps bracketed content inside the message', () => {
    const { tag, message } = formatLogLine(
      '[2026/07/29 03:48:34   INFO]  [Hytale] (N) [Archonte] Naeliz : hey',
    )
    expect(tag).toBe('Hytale')
    expect(message).toBe('(N) [Archonte] Naeliz : hey')
  })

  it('keeps a channel tag when nothing follows it', () => {
    const { tag, message } = formatLogLine('[2026/07/29 03:49:25   INFO] [SOUT] === NPC DEATH ===')
    expect(tag).toBeNull()
    expect(message).toBe('=== NPC DEATH ===')
  })
})

describe('tagHue', () => {
  it('is stable for the same tag', () => {
    expect(tagHue('ModProfiler')).toBe(tagHue('ModProfiler'))
  })

  it('stays within the hue range', () => {
    for (const tag of ['Hytale', 'ModProfiler', 'InventoryManager', 'a', '']) {
      const hue = tagHue(tag)
      expect(hue).toBeGreaterThanOrEqual(0)
      expect(hue).toBeLessThan(360)
    }
  })

  it('differs for different tags', () => {
    expect(tagHue('Hytale')).not.toBe(tagHue('ModProfiler'))
  })
})
