import type {
  HealthStatus,
  LogsQueryResponse,
  LogLevel,
  PlayersResponse,
  ModsResponse,
  PublicConfig,
  ConsoleSendResponse,
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
  sendConsoleCommand: (command: string) =>
    postJson<ConsoleSendResponse>('/api/console/send', { command }),
}
