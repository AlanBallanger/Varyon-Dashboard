import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { AppEnv } from './env'
import { detectLevel } from './loki'
import type { ConsoleStreamResponse, LogLine } from './types'

const execFileAsync = promisify(execFile)

/** journalctl -o json emits one JSON object per line. */
type JournalEntry = {
  MESSAGE?: string | number[]
  __REALTIME_TIMESTAMP?: string
  __CURSOR?: string
}

/** CSI sequences (colours) plus the bare ESC that Hytale emits around lines. */
const ANSI_RE = /\[[0-9;?]*[ -/]*[@-~]|/g

export function stripAnsi(text: string): string {
  return text.replace(ANSI_RE, '')
}

function decodeMessage(message: JournalEntry['MESSAGE']): string {
  // Non-UTF8 messages come back as a byte array
  if (Array.isArray(message)) return Buffer.from(message).toString('utf8')
  return message ?? ''
}

export function parseJournalOutput(stdout: string): { lines: LogLine[]; cursor?: string } {
  const lines: LogLine[] = []
  let cursor: string | undefined
  for (const raw of stdout.split('\n')) {
    if (!raw.trim()) continue
    let entry: JournalEntry
    try {
      entry = JSON.parse(raw)
    } catch {
      continue
    }
    const line = stripAnsi(decodeMessage(entry.MESSAGE))
    const us = Number(entry.__REALTIME_TIMESTAMP ?? 0)
    lines.push({
      ts: new Date(us / 1000).toISOString(),
      line,
      level: detectLevel(line),
      labels: {},
    })
    if (entry.__CURSOR) cursor = entry.__CURSOR
  }
  return { lines, cursor }
}

export async function readJournal(
  env: AppEnv,
  opts: { cursor?: string; lines?: number },
): Promise<ConsoleStreamResponse> {
  const args = ['-u', env.consoleUnit, '-o', 'json', '--no-pager']
  if (opts.cursor) {
    args.push(`--after-cursor=${opts.cursor}`)
  } else {
    // First load: show recent history rather than the whole journal
    args.push('-n', String(opts.lines ?? 300))
  }

  const { stdout } = await execFileAsync('journalctl', args, {
    maxBuffer: 16 * 1024 * 1024,
  })
  const { lines, cursor } = parseJournalOutput(stdout)
  return { lines, cursor: cursor ?? opts.cursor }
}
