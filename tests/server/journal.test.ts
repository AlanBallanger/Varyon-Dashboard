import { describe, it, expect } from 'vitest'
import { parseJournalOutput, stripAnsi } from '../../server/journal'

const ESC = String.fromCharCode(27)

describe('stripAnsi', () => {
  it('removes colour codes from a coloured chat line', () => {
    const line = `${ESC}[m[2026/07/29 03:48:34   INFO] [Hytale] ${ESC}[38;5;26m(N)${ESC}[0m ${ESC}[38;5;196m[Archonte] Naeliz${ESC}[0m : hey${ESC}[m`
    expect(stripAnsi(line)).toBe('[2026/07/29 03:48:34   INFO] [Hytale] (N) [Archonte] Naeliz : hey')
  })

  it('leaves plain text untouched', () => {
    expect(stripAnsi('[INFO] no colours here')).toBe('[INFO] no colours here')
  })
})

describe('parseJournalOutput', () => {
  it('extracts lines, timestamps and the last cursor', () => {
    const stdout = [
      JSON.stringify({
        MESSAGE: '[INFO] first',
        __REALTIME_TIMESTAMP: '1700000000000000',
        __CURSOR: 'c1',
      }),
      JSON.stringify({
        MESSAGE: `${ESC}[0m[ERROR] second`,
        __REALTIME_TIMESTAMP: '1700000001000000',
        __CURSOR: 'c2',
      }),
    ].join('\n')

    const { lines, cursor } = parseJournalOutput(stdout)

    expect(lines).toHaveLength(2)
    expect(lines[0].ts).toBe('2023-11-14T22:13:20.000Z')
    expect(lines[1].line).toBe('[ERROR] second')
    expect(lines[1].level).toBe('ERROR')
    expect(cursor).toBe('c2')
  })

  it('decodes byte-array messages', () => {
    const stdout = JSON.stringify({
      MESSAGE: [104, 101, 108, 108, 111],
      __REALTIME_TIMESTAMP: '1700000000000000',
      __CURSOR: 'c1',
    })
    expect(parseJournalOutput(stdout).lines[0].line).toBe('hello')
  })

  it('skips malformed json lines', () => {
    const stdout = ['not json', JSON.stringify({ MESSAGE: 'ok', __CURSOR: 'c1' })].join('\n')
    expect(parseJournalOutput(stdout).lines).toHaveLength(1)
  })
})
