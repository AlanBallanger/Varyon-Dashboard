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

export type LogFileInfo = {
  name: string
  sizeBytes: number
  modifiedMs: number
}

export type LogFileListResponse = {
  files: LogFileInfo[]
  path: string
}

export type LogFileReadResponse = {
  lines: LogLine[]
  nextOffset: number
  sizeBytes: number
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

export type ServerEnvironment = {
  id: string
  label: string
}

export type EnvironmentsResponse = {
  environments: ServerEnvironment[]
  default: string
}

export type ServerAction = 'start' | 'stop' | 'restart'

export type ServerStatus = {
  id: string
  label: string
  unit: string
  /** systemd ActiveState: active, inactive, failed, activating… */
  activeState: string
  subState: string
  running: boolean
  activeSinceMs?: number
  /** Set when the unit status could not be read. */
  error?: string
}

export type ServersResponse = {
  servers: ServerStatus[]
}

export type ConsoleSendResponse = {
  ok: true
}

export type ConsoleStreamResponse = {
  lines: LogLine[]
  /** Opaque journald cursor; send it back to fetch only newer entries. */
  cursor?: string
}
