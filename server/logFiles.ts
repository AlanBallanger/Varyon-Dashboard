import { readdir, stat, open } from 'node:fs/promises'
import { join, normalize, resolve } from 'node:path'
import type { AppEnv } from './env'
import { detectLevel } from './loki'
import type { LogFileInfo, LogFileListResponse, LogFileReadResponse, LogLine } from './types'

const MAX_READ_BYTES = 2 * 1024 * 1024

const LINE_TS_RE = /^\[(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/

/** Extracts the [yyyy/mm/dd hh:mm:ss] prefix Hytale writes at the start of each line (UTC). */
function extractLineTs(line: string): string | null {
  const m = LINE_TS_RE.exec(line)
  if (!m) return null
  const [, y, mo, d, h, mi, s] = m
  const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s)))
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function resolveLogFilePath(logsDir: string, name: string): string {
  if (!name || name.includes('/') || name.includes('\\') || name.includes('..')) {
    throw new Error('Invalid log file name')
  }
  const dir = resolve(logsDir)
  const full = normalize(join(dir, name))
  if (full !== join(dir, name) || !full.startsWith(dir)) {
    throw new Error('Invalid log file name')
  }
  return full
}

export async function listLogFiles(env: AppEnv): Promise<LogFileListResponse> {
  const entries = await readdir(env.logsDir, { withFileTypes: true })
  const files: LogFileInfo[] = []
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.log')) continue
    const full = join(env.logsDir, entry.name)
    const s = await stat(full)
    files.push({
      name: entry.name,
      sizeBytes: s.size,
      modifiedMs: s.mtimeMs,
    })
  }
  files.sort((a, b) => b.modifiedMs - a.modifiedMs)
  return { files, path: env.logsDir }
}

/** Reads a slice of a log file starting at byte offset `from` (default: tail of file). */
export async function readLogFile(
  env: AppEnv,
  opts: { name: string; from?: number },
): Promise<LogFileReadResponse> {
  const full = resolveLogFilePath(env.logsDir, opts.name)
  const s = await stat(full)
  const size = s.size

  let start = opts.from ?? Math.max(0, size - MAX_READ_BYTES)
  if (start > size) start = size
  const length = Math.min(size - start, MAX_READ_BYTES)

  let text = ''
  if (length > 0) {
    const handle = await open(full, 'r')
    try {
      const buf = Buffer.alloc(length)
      await handle.read(buf, 0, length, start)
      text = buf.toString('utf8')
    } finally {
      await handle.close()
    }
  }

  // Drop a possibly-truncated first line when reading from the middle of the file.
  let lines = text.split('\n')
  if (start > 0 && lines.length > 1) lines = lines.slice(1)
  const consumed = lines.filter((l) => l.length > 0)

  let lastKnownTs = new Date().toISOString()
  const logLines: LogLine[] = consumed
    .filter((l) => l.trim().length > 0)
    .map((l) => {
      const ts = extractLineTs(l)
      if (ts) lastKnownTs = ts
      return { ts: ts ?? lastKnownTs, line: l, level: detectLevel(l), labels: {} }
    })

  return { lines: logLines, nextOffset: size, sizeBytes: size }
}
