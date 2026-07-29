import type { LogLine } from '@/types/api'

/** Sentinel for log lines with no [Tag] */
export const UNTAGGED_MOD = 'Sans tag'

const TAG_RE = /\[([^\]|]+)(?:\|[^\]]*)?\]/g

function isModTagName(name: string): boolean {
  if (!name) return false
  // Loki/Hytale timestamp wrappers: [2026/07/28 22:31:13 INFO]
  if (/^\d{4}\/\d{2}\/\d{2}/.test(name)) return false
  if (/^(INFO|WARN|ERROR|DEBUG|TRACE|UNKNOWN)$/i.test(name)) return false
  return /^[A-Za-z_]/.test(name)
}

/** Collapse fully-qualified Java logger names to their last segment: com.varyon.comet.CometModPlugin -> CometModPlugin */
function shortenTagName(name: string): string {
  if (!name.includes('.')) return name
  const segments = name.split('.')
  return segments[segments.length - 1] || name
}

/**
 * Extract the mod/component name from a log line's leading [Name] / [Name|P] tag.
 * Only the first valid tag is treated as the emitting mod — later tags on the
 * same line are contextual (debug markers, method names, player names, etc.)
 * and would otherwise pollute the mod list (e.g. a player tag like [Marobo]).
 */
export function extractModTags(line: string): string[] {
  for (const match of line.matchAll(TAG_RE)) {
    const raw = match[1]?.trim()
    if (!raw || !isModTagName(raw)) continue
    return [shortenTagName(raw)]
  }
  return []
}

/** Sorted unique mod names from lines; includes UNTAGGED_MOD if any line has no tags. */
export function collectModNames(lines: LogLine[]): string[] {
  const names = new Set<string>()
  let hasUntagged = false
  for (const l of lines) {
    const tags = extractModTags(l.line)
    if (!tags.length) {
      hasUntagged = true
      continue
    }
    for (const t of tags) names.add(t)
  }
  const sorted = [...names].sort((a, b) => a.localeCompare(b, 'fr'))
  if (hasUntagged) sorted.push(UNTAGGED_MOD)
  return sorted
}

/**
 * Filter predicate. `selected === null` means "all mods" (default).
 * Empty Set means show nothing.
 */
export function lineMatchesMods(line: LogLine, selected: Set<string> | null): boolean {
  if (selected === null) return true
  if (selected.size === 0) return false
  const tags = extractModTags(line.line)
  if (!tags.length) return selected.has(UNTAGGED_MOD)
  return tags.some((t) => selected.has(t))
}
