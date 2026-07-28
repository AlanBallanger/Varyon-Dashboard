import { onMounted, onUnmounted, ref, watch } from 'vue'
import { api } from '@/services/api'
import type { LogLevel, LogLine } from '@/types/api'

function lineKey(line: LogLine) {
  return `${line.ts}|${line.line}`
}

export function useLogs() {
  const lines = ref<LogLine[]>([])
  const filter = ref('')
  const level = ref<LogLevel>('ALL')
  const live = ref(true)
  const paused = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selector = ref('')
  const logsPollMs = ref(2000)
  const seen = new Set<string>()
  let timer: ReturnType<typeof setInterval> | undefined
  let windowStart = Date.now() - 15 * 60_000

  async function loadConfig() {
    try {
      const cfg = await api.getPublicConfig()
      selector.value = cfg.lokiLogSelector
      logsPollMs.value = cfg.logsPollMs
    } catch {
      /* keep defaults */
    }
  }

  async function fetchOnce() {
    if (paused.value) return
    loading.value = true
    try {
      const end = Date.now()
      const result = await api.getLogsQuery({
        start: windowStart,
        end,
        limit: 500,
        filter: filter.value || undefined,
        level: level.value,
      })
      selector.value = result.selector
      for (const line of result.lines) {
        const key = lineKey(line)
        if (!seen.has(key)) {
          seen.add(key)
          lines.value.push(line)
        }
      }
      if (lines.value.length > 2000) {
        const dropped = lines.value.splice(0, lines.value.length - 2000)
        for (const d of dropped) seen.delete(lineKey(d))
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
  }

  function restartPolling() {
    if (timer) clearInterval(timer)
    timer = undefined
    if (live.value && !paused.value) {
      timer = setInterval(() => void fetchOnce(), logsPollMs.value)
    }
  }

  function togglePause() {
    paused.value = !paused.value
    restartPolling()
    if (!paused.value) void fetchOnce()
  }

  watch([filter, level], () => {
    clearLines()
    void fetchOnce()
  })

  watch(live, (on) => {
    if (!on && timer) {
      clearInterval(timer)
      timer = undefined
    } else {
      restartPolling()
    }
  })

  onMounted(async () => {
    await loadConfig()
    await fetchOnce()
    restartPolling()
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return {
    lines,
    filter,
    level,
    live,
    paused,
    loading,
    error,
    selector,
    fetchOnce,
    clearLines,
    togglePause,
  }
}
