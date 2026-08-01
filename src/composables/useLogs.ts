import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { api } from '@/services/api'
import type { LogFileInfo, LogLevel, LogLine } from '@/types/api'
import { collectModNames, lineMatchesMods } from '@/utils/logMods'

/** Source 'live' polls the current Loki stream; any other value is a log file name. */
export const LIVE_SOURCE = 'live'

/** Max lines kept in the rolling live buffer. */
const MAX_LIVE_BUFFER = 10_000
/** Page size for range queries (Loki caps a single query at 5000 by default). */
const RANGE_PAGE_LIMIT = 1000
/** Safety cap on total lines fetched for one time range. */
const RANGE_MAX_LINES = 10_000

function lineKey(line: LogLine) {
  return `${line.ts}|${line.line}`
}

export function useLogs() {
  const lines = ref<LogLine[]>([])
  const filter = ref('')
  const level = ref<LogLevel>('ALL')
  /** datetime-local strings; empty = no bound */
  const startTime = ref('')
  const endTime = ref('')
  /** null = all mods selected */
  const selectedMods = ref<string[] | null>(null)
  const paused = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const logsPollMs = ref(2000)
  const source = ref<string>(LIVE_SOURCE)
  const logFiles = ref<LogFileInfo[]>([])
  const seen = new Set<string>()
  let timer: ReturnType<typeof setInterval> | undefined
  let windowStart = Date.now() - 15 * 60_000
  let fileOffset = 0

  const availableMods = computed(() => collectModNames(lines.value))

  const isRangeMode = computed(() => Boolean(startTime.value || endTime.value))

  function rangeBounds() {
    const end = endTime.value ? new Date(endTime.value).getTime() : Date.now()
    const start = startTime.value
      ? new Date(startTime.value).getTime()
      : end - 24 * 3_600_000
    return { start, end }
  }

  const visibleLines = computed(() => {
    const sel =
      selectedMods.value === null ? null : new Set(selectedMods.value)
    return lines.value.filter((l) => lineMatchesMods(l, sel))
  })

  async function loadConfig() {
    try {
      const cfg = await api.getPublicConfig()
      logsPollMs.value = cfg.logsPollMs
    } catch {
      /* keep defaults */
    }
  }

  async function loadLogFiles() {
    try {
      const result = await api.getLogFiles()
      logFiles.value = result.files
    } catch {
      /* keep previous list */
    }
  }

  function matchesFilters(line: LogLine): boolean {
    if (level.value !== 'ALL' && line.level !== level.value) return false
    if (filter.value && !line.line.toLowerCase().includes(filter.value.toLowerCase())) return false
    if (isRangeMode.value) {
      const t = new Date(line.ts).getTime()
      const { start, end } = rangeBounds()
      if (t < start || t > end) return false
    }
    return true
  }

  async function fetchLiveOnce() {
    const end = Date.now()
    const result = await api.getLogsQuery({
      start: windowStart,
      end,
      limit: 500,
      filter: filter.value || undefined,
      level: level.value,
    })
    for (const line of result.lines) {
      const key = lineKey(line)
      if (!seen.has(key)) {
        seen.add(key)
        lines.value.push(line)
      }
    }
    windowStart = end
  }

  /** Fetch a fixed time range, paginating past Loki's per-query limit. */
  async function fetchRangeOnce() {
    const { start, end } = rangeBounds()
    let cursor = start
    while (lines.value.length < RANGE_MAX_LINES) {
      const result = await api.getLogsQuery({
        start: cursor,
        end,
        limit: RANGE_PAGE_LIMIT,
        filter: filter.value || undefined,
        level: level.value,
      })
      for (const line of result.lines) {
        const key = lineKey(line)
        if (!seen.has(key)) {
          seen.add(key)
          lines.value.push(line)
        }
      }
      if (result.lines.length < RANGE_PAGE_LIMIT) break
      const lastTs = new Date(result.lines[result.lines.length - 1].ts).getTime()
      cursor = lastTs > cursor ? lastTs : cursor + 1
    }
  }

  async function fetchFileOnce() {
    const result = await api.getLogFile({ name: source.value, from: fileOffset })
    fileOffset = result.nextOffset
    for (const line of result.lines) {
      if (matchesFilters(line)) lines.value.push(line)
    }
  }

  async function fetchOnce() {
    if (paused.value) return
    loading.value = true
    try {
      if (source.value === LIVE_SOURCE) {
        if (isRangeMode.value) {
          await fetchRangeOnce()
        } else {
          await fetchLiveOnce()
          if (lines.value.length > MAX_LIVE_BUFFER) {
            const dropped = lines.value.splice(0, lines.value.length - MAX_LIVE_BUFFER)
            for (const d of dropped) seen.delete(lineKey(d))
          }
        }
      } else {
        await fetchFileOnce()
      }
      error.value = null
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  function clearLines() {
    lines.value = []
    seen.clear()
    windowStart = Date.now() - 15 * 60_000
    fileOffset = 0
  }

  function selectSource(next: string) {
    if (next === source.value) return
    source.value = next
    clearLines()
    restartPolling()
    void fetchOnce()
  }

  function restartPolling() {
    if (timer) clearInterval(timer)
    timer = undefined
    // A fixed time range on the live source is a one-shot query, not a stream.
    if (source.value === LIVE_SOURCE && isRangeMode.value) return
    if (!paused.value) {
      timer = setInterval(() => void fetchOnce(), logsPollMs.value)
    }
  }

  function togglePause() {
    paused.value = !paused.value
    restartPolling()
    if (!paused.value) void fetchOnce()
  }

  function selectAllMods() {
    selectedMods.value = null
  }

  function selectNoMods() {
    selectedMods.value = []
  }

  function toggleMod(mod: string, checked: boolean) {
    const all = availableMods.value
    let next: Set<string>
    if (selectedMods.value === null) {
      next = new Set(all)
    } else {
      next = new Set(selectedMods.value)
    }
    if (checked) next.add(mod)
    else next.delete(mod)

    if (next.size === all.length && all.every((m) => next.has(m))) {
      selectedMods.value = null
    } else {
      selectedMods.value = [...next]
    }
  }

  // Drop unknown selections when the available set shrinks (e.g. buffer trim)
  watch(availableMods, (mods) => {
    if (selectedMods.value === null) return
    // Keep selection while buffer is empty (text/level refetch)
    if (!mods.length) return
    const allowed = new Set(mods)
    const pruned = selectedMods.value.filter((m) => allowed.has(m))
    if (pruned.length === mods.length && mods.every((m) => pruned.includes(m))) {
      selectedMods.value = null
    } else if (pruned.length !== selectedMods.value.length) {
      selectedMods.value = pruned
    }
  })

  watch([filter, level, startTime, endTime], () => {
    clearLines()
    restartPolling()
    void fetchOnce()
  })

  onMounted(async () => {
    await loadConfig()
    await loadLogFiles()
    await fetchOnce()
    restartPolling()
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return {
    lines,
    visibleLines,
    filter,
    level,
    startTime,
    endTime,
    selectedMods,
    availableMods,
    paused,
    loading,
    error,
    source,
    logFiles,
    fetchOnce,
    clearLines,
    togglePause,
    selectAllMods,
    selectNoMods,
    toggleMod,
    selectSource,
    loadLogFiles,
  }
}
