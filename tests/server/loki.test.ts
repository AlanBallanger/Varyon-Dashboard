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
    expect(buildLogQL('{job="hytale"}', undefined, 'ERROR')).toBe('{job="hytale"} |~ "(?i)ERROR"')
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
