export type HealthStatus = {
  loki: { ok: boolean; detail?: string }
  prometheus: { ok: boolean; detail?: string }
}

export type LogLevel = 'ALL' | 'INFO' | 'WARN' | 'ERROR'

export type LogLine = {
  ts: string
  line: string
  level: Exclude<LogLevel, 'ALL'> | 'UNKNOWN'
  labels: Record<string, string>
}

export type LogsQueryResponse = {
  lines: LogLine[]
  selector: string
}

export type PlayerInfo = {
  name: string
  labels: Record<string, string>
}

export type PlayersResponse = {
  count: number
  players: PlayerInfo[]
  metric: string
  missingMetric: boolean
}

export type ModInfo = {
  name: string
  path: string
  kind: 'file' | 'directory'
  sizeBytes?: number
}

export type ModsResponse = {
  mods: ModInfo[]
  path: string
}

export type PublicConfig = {
  lokiLogSelector: string
  playersPollMs: number
  logsPollMs: number
}
