import { describe, it, expect } from 'vitest'
import {
  UNTAGGED_MOD,
  extractModTags,
  collectModNames,
  lineMatchesMods,
} from '../../src/utils/logMods'
import type { LogLine } from '../../src/types/api'

function line(text: string): LogLine {
  return { ts: '2026-07-28T22:00:00Z', line: text, level: 'INFO', labels: {} }
}

describe('extractModTags', () => {
  it('extracts simple [Name] tags', () => {
    expect(extractModTags('[InventoryManager] Auto-save: 1 file(s) written')).toEqual([
      'InventoryManager',
    ])
  })

  it('strips |P suffix from [Name|P]', () => {
    expect(extractModTags('[ModProfiler|P] ModProfiler 0h 31m')).toEqual(['ModProfiler'])
    expect(extractModTags('[Universe|P] Backing up universe...')).toEqual(['Universe'])
  })

  it('extracts multiple tags in one line', () => {
    expect(extractModTags('[SOUT] [EcotalJobs] === NPC DEATH ===')).toEqual([
      'SOUT',
      'EcotalJobs',
    ])
  })

  it('returns empty when no brackets', () => {
    expect(extractModTags('plain log without tags')).toEqual([])
  })

  it('ignores timestamp brackets like [2026/07/28 22:31:13 INFO]', () => {
    expect(
      extractModTags(
        'INFO  [2026/07/28 22:31:13 INFO]: [EcotalJobs] === NPC DEATH ===',
      ),
    ).toEqual(['EcotalJobs'])
  })

  it('ignores empty brackets', () => {
    expect(extractModTags('[] nothing')).toEqual([])
  })

  it('shortens fully-qualified Java logger names to their last segment', () => {
    expect(
      extractModTags('[com.varyon.comet.CometModPlugin] CometMod started!'),
    ).toEqual(['CometModPlugin'])
    expect(
      extractModTags('[com.varyon.comet.CometConfig] Using plugin directory'),
    ).toEqual(['CometConfig'])
  })
})

describe('collectModNames', () => {
  it('returns sorted unique mods plus Sans tag when needed', () => {
    const names = collectModNames([
      line('[ModProfiler|P] a'),
      line('[InventoryManager] b'),
      line('[ModProfiler|P] c'),
      line('no tag here'),
    ])
    expect(names).toEqual(['InventoryManager', 'ModProfiler', UNTAGGED_MOD])
  })

  it('omits Sans tag when every line is tagged', () => {
    expect(collectModNames([line('[Hytale] ok')])).toEqual(['Hytale'])
  })
})

describe('lineMatchesMods', () => {
  it('matches when all mods are selected (null = all)', () => {
    expect(lineMatchesMods(line('[ModProfiler|P] x'), null)).toBe(true)
    expect(lineMatchesMods(line('plain'), null)).toBe(true)
  })

  it('matches tagged line if any tag is selected', () => {
    const selected = new Set(['EcotalJobs', 'Hytale'])
    expect(lineMatchesMods(line('[SOUT] [EcotalJobs] death'), selected)).toBe(true)
    expect(lineMatchesMods(line('[ModProfiler|P] x'), selected)).toBe(false)
  })

  it('matches untagged lines only when Sans tag is selected', () => {
    const withUntagged = new Set([UNTAGGED_MOD])
    const without = new Set(['Hytale'])
    expect(lineMatchesMods(line('plain'), withUntagged)).toBe(true)
    expect(lineMatchesMods(line('plain'), without)).toBe(false)
  })

  it('matches nothing when selection is empty', () => {
    expect(lineMatchesMods(line('[Hytale] ok'), new Set())).toBe(false)
  })
})
