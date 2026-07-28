import type { AppEnv } from './env'

export async function promQuery(env: AppEnv, query: string): Promise<unknown> {
  const params = new URLSearchParams({ query })
  const url = `${env.prometheusUrl.replace(/\/$/, '')}/api/v1/query?${params}`
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Prometheus ${res.status}: ${body}`)
  }
  return res.json()
}
