/** Channel tags that say where output came from, not which mod produced it. */
const CHANNEL_TAGS = new Set(['SOUT', 'SERR', 'STDOUT', 'STDERR'])

/** Leading `[2026/07/29 03:38:47   INFO]` — already shown as time/level columns. */
const PREFIX_RE = /^\[\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}\s+\w+\]\s*/

/** A `[Tag]` or `[Tag|P]` at the start of what remains. */
const LEADING_TAG_RE = /^\[([^\]|]+)(?:\|[^\]]*)?\]\s*/

export type FormattedLine = {
  /** Primary source tag, or null when the line has none (stack traces, blank lines). */
  tag: string | null
  /** Message with the timestamp prefix and tag removed. */
  message: string
}

/** Collapse `com.varyon.comet.CometModPlugin` to `CometModPlugin`. */
function shortenTagName(name: string): string {
  if (!name.includes('.')) return name
  const segments = name.split('.')
  return segments[segments.length - 1] || name
}

/**
 * Split a raw log line into its source tag and message, dropping the redundant
 * timestamp/level prefix. Channel tags like `[SOUT]` are skipped in favour of the
 * mod tag that follows them.
 */
export function formatLogLine(raw: string): FormattedLine {
  let rest = raw.replace(PREFIX_RE, '')
  let tag: string | null = null

  // Walk leading tags: keep the first meaningful one, skip channel markers.
  for (;;) {
    const match = rest.match(LEADING_TAG_RE)
    if (!match) break
    const name = match[1].trim()
    if (!name) break
    const isChannel = CHANNEL_TAGS.has(name.toUpperCase())
    if (!isChannel) {
      tag = shortenTagName(name)
      rest = rest.slice(match[0].length)
      break
    }
    rest = rest.slice(match[0].length)
  }

  return { tag, message: rest.trimEnd() }
}

/** Deterministic hue per tag so a given mod keeps its colour across sessions. */
export function tagHue(tag: string): number {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % 360
}
