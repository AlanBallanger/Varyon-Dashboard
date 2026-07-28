import type { AppEnv } from './env'
import type { HealthStatus } from './types'

async function ping(url: string): Promise<{ ok: boolean; detail?: string }> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` }
    return { ok: true }
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : String(e) }
  }
}

export async function getHealth(env: AppEnv): Promise<HealthStatus> {
  const [loki, prometheus] = await Promise.all([
    ping(`${env.lokiUrl.replace(/\/$/, '')}/ready`),
    ping(`${env.prometheusUrl.replace(/\/$/, '')}/-/ready`),
  ])
  return { loki, prometheus }
}
