import type { AppEnv } from './env'
import type { PlayerInfo, PlayersResponse } from './types'
import { promQuery } from './prometheus'

export function normalizePlayersPayload(payload: unknown, metric: string): PlayersResponse {
  const root = payload as {
    data?: { result?: Array<{ metric?: Record<string, string>; value?: [number, string] }> }
  }
  const result = root.data?.result ?? []
  if (result.length === 0) {
    return { count: 0, players: [], metric, missingMetric: true }
  }

  const players: PlayerInfo[] = []
  for (const sample of result) {
    const labels = sample.metric ?? {}
    const name = labels.player ?? labels.name ?? labels.username
    if (name) {
      players.push({ name, labels })
    }
  }

  if (players.length > 0) {
    return { count: players.length, players, metric, missingMetric: false }
  }

  const raw = result[0]?.value?.[1]
  const count = Number(raw ?? 0)
  return {
    count: Number.isFinite(count) ? count : 0,
    players: [],
    metric,
    missingMetric: false,
  }
}

export async function getPlayers(env: AppEnv): Promise<PlayersResponse> {
  const payload = await promQuery(env, env.playersPromql)
  return normalizePlayersPayload(payload, env.playersPromql)
}
