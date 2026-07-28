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
