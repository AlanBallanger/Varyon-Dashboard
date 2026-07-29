import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { api } from '@/services/api'
import type { LogLevel, LogLine } from '@/types/api'
import { collectModNames, lineMatchesMods } from '@/utils/logMods'

function lineKey(line: LogLine) {
  return `${line.ts}|${line.line}`
}

export function useLogs() {
  const lines = ref<LogLine[]>([])
  const filter = ref('')
  const level = ref<LogLevel>('ALL')
  /** null = all mods selected */
  const selectedMods = ref<string[] | null>(null)
  const live = ref(true)
  const paused = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selector = ref('')
  const logsPollMs = ref(2000)
  const seen = new Set<string>()
  let timer: ReturnType<typeof setInterval> | undefined
  let windowStart = Date.now() - 15 * 60_000

  const availableMods = computed(() => collectModNames(lines.value))

  const visibleLines = computed(() => {
    const sel =
      selectedMods.value === null ? null : new Set(selectedMods.value)
    return lines.value.filter((l) => lineMatchesMods(l, sel))
  })

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
      windowStart = end
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
    visibleLines,
    filter,
    level,
    selectedMods,
    availableMods,
    live,
    paused,
    loading,
    error,
    selector,
    fetchOnce,
    clearLines,
    togglePause,
    selectAllMods,
    selectNoMods,
    toggleMod,
  }
}
