import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { listEnvironments, resolveEnv } from './env'
import type { ServerAction, ServerStatus, ServersResponse } from './types'

const execFileAsync = promisify(execFile)

export const SERVER_ACTIONS: ServerAction[] = ['start', 'stop', 'restart']

export function isServerAction(value: string): value is ServerAction {
  return (SERVER_ACTIONS as string[]).includes(value)
}

/** `systemctl show` prints `Key=Value` lines; absent values come back empty, not missing. */
export function parseSystemctlShow(stdout: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const raw of stdout.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    const eq = line.indexOf('=')
    if (eq <= 0) continue
    result[line.slice(0, eq)] = line.slice(eq + 1)
  }
  return result
}

export function toServerStatus(
  id: string,
  label: string,
  unit: string,
  props: Record<string, string>,
): ServerStatus {
  const activeState = props.ActiveState || 'unknown'
  const timestamp = props.ActiveEnterTimestamp
  const since = timestamp ? Date.parse(timestamp) : NaN
  return {
    id,
    label,
    unit,
    activeState,
    subState: props.SubState || 'unknown',
    running: activeState === 'active',
    // Absent when the unit never started, or when the timestamp is unparseable
    activeSinceMs: Number.isNaN(since) ? undefined : since,
  }
}

async function readUnitStatus(id: string, label: string): Promise<ServerStatus> {
  const unit = resolveEnv(id).consoleUnit
  try {
    const { stdout } = await execFileAsync('systemctl', [
      'show',
      unit,
      '--property=ActiveState',
      '--property=SubState',
      '--property=ActiveEnterTimestamp',
      '--no-pager',
    ])
    return toServerStatus(id, label, unit, parseSystemctlShow(stdout))
  } catch (e) {
    return {
      id,
      label,
      unit,
      activeState: 'unknown',
      subState: 'unknown',
      running: false,
      error: e instanceof Error ? e.message : String(e),
    }
  }
}

export async function listServers(): Promise<ServersResponse> {
  const servers = await Promise.all(
    listEnvironments().map((env) => readUnitStatus(env.id, env.label)),
  )
  return { servers }
}

export async function runServerAction(id: string, action: ServerAction): Promise<ServerStatus> {
  const env = listEnvironments().find((e) => e.id === id)
  if (!env) throw new Error(`Unknown server "${id}"`)
  const unit = resolveEnv(id).consoleUnit

  await execFileAsync('systemctl', [action, unit], { timeout: 60_000 })
  return readUnitStatus(env.id, env.label)
}
