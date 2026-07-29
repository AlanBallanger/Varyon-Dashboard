import type {
  HealthStatus,
  LogsQueryResponse,
  LogLevel,
  PlayersResponse,
  ModsResponse,
  PublicConfig,
  ConsoleSendResponse,
  ConsoleStreamResponse,
  LogFileListResponse,
  LogFileReadResponse,
} from '@/types/api'

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(body || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(body || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  getHealth: () => getJson<HealthStatus>('/api/health'),
  getPublicConfig: () => getJson<PublicConfig>('/api/config/public'),
  getPlayers: () => getJson<PlayersResponse>('/api/players'),
  getMods: () => getJson<ModsResponse>('/api/mods'),
  getLogsQuery: (q: {
    start: number
    end: number
    limit?: number
    filter?: string
    level?: LogLevel
  }) => {
    const params = new URLSearchParams({
      start: String(q.start),
      end: String(q.end),
      limit: String(q.limit ?? 500),
      level: q.level ?? 'ALL',
    })
    if (q.filter) params.set('filter', q.filter)
    return getJson<LogsQueryResponse>(`/api/logs/query?${params}`)
  },
  getLogFiles: () => getJson<LogFileListResponse>('/api/logs/files'),
  getLogFile: (q: { name: string; from?: number }) => {
    const params = new URLSearchParams({ name: q.name })
    if (q.from !== undefined) params.set('from', String(q.from))
    return getJson<LogFileReadResponse>(`/api/logs/file?${params}`)
  },
  sendConsoleCommand: (command: string) =>
    postJson<ConsoleSendResponse>('/api/console/send', { command }),
  getConsoleStream: (cursor?: string) => {
    const params = new URLSearchParams()
    if (cursor) params.set('cursor', cursor)
    const qs = params.toString()
    return getJson<ConsoleStreamResponse>(`/api/console/stream${qs ? `?${qs}` : ''}`)
  },
}
