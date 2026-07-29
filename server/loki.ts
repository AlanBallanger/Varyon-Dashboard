import type { AppEnv } from './env'
import type { LogLevel, LogLine, LogsQueryResponse } from './types'

export function buildLogQL(
  selector: string,
  filter?: string,
  level: LogLevel = 'ALL',
): string {
  let q = selector.trim()
  if (filter?.trim()) {
    const escaped = filter.trim().replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    q += ` |= "${escaped}"`
  }
  if (level !== 'ALL') {
    q += ` |~ "(?i)${level}"`
  }
  return q
}

export function detectLevel(line: string): LogLine['level'] {
  if (/\bERROR\b/i.test(line)) return 'ERROR'
  if (/\bWARN(ING)?\b/i.test(line)) return 'WARN'
  if (/\bINFO\b/i.test(line)) return 'INFO'
  return 'UNKNOWN'
}

export function normalizeLokiMatrix(payload: unknown): LogLine[] {
  const root = payload as {
    data?: { result?: Array<{ stream?: Record<string, string>; values?: string[][] }> }
  }
  const result = root.data?.result ?? []
  const lines: LogLine[] = []
  for (const stream of result) {
    const labels = stream.stream ?? {}
    for (const pair of stream.values ?? []) {
      const [ns, line] = pair
      const ms = Math.floor(Number(ns) / 1_000_000)
      lines.push({
        ts: new Date(ms).toISOString(),
        line,
        level: detectLevel(line),
        labels,
      })
    }
  }
  lines.sort((a, b) => a.ts.localeCompare(b.ts))
  return lines
}

export async function listLokiLabelValues(env: AppEnv, label: string): Promise<string[]> {
  const url = `${env.lokiUrl.replace(/\/$/, '')}/loki/api/v1/label/${encodeURIComponent(label)}/values`
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Loki ${res.status}: ${body}`)
  }
  const json = (await res.json()) as { data?: string[] }
  return json.data ?? []
}

export async function queryLokiLogs(
  env: AppEnv,
  opts: {
    startMs: number
    endMs: number
    limit?: number
    filter?: string
    level?: LogLevel
  },
): Promise<LogsQueryResponse> {
  const selector = env.lokiLogSelector
  const query = buildLogQL(selector, opts.filter, opts.level ?? 'ALL')
  const params = new URLSearchParams({
    query,
    start: String(opts.startMs * 1_000_000),
    end: String(opts.endMs * 1_000_000),
    limit: String(opts.limit ?? 500),
    direction: 'forward',
  })
  const url = `${env.lokiUrl.replace(/\/$/, '')}/loki/api/v1/query_range?${params}`
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Loki ${res.status}: ${body}`)
  }
  const json = await res.json()
  return { lines: normalizeLokiMatrix(json), selector }
}
