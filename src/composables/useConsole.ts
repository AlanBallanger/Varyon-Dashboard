import { onMounted, onUnmounted, ref } from 'vue'
import { api } from '@/services/api'
import type { LogLine } from '@/types/api'

const POLL_MS = 1000
const MAX_LINES = 2000

export function useConsole() {
  const lines = ref<LogLine[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const sending = ref(false)
  const sendError = ref<string | null>(null)
  const history = ref<string[]>([])

  let cursor: string | undefined
  let timer: ReturnType<typeof setInterval> | undefined
  let historyIndex = -1

  async function fetchOnce() {
    loading.value = true
    try {
      const result = await api.getConsoleStream(cursor)
      // The journald cursor already excludes what we've seen: just append.
      if (result.lines.length) lines.value.push(...result.lines)
      if (lines.value.length > MAX_LINES) {
        lines.value.splice(0, lines.value.length - MAX_LINES)
      }
      cursor = result.cursor
      error.value = null
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  async function send(command: string) {
    const trimmed = command.trim()
    if (!trimmed || sending.value) return
    sending.value = true
    sendError.value = null
    try {
      await api.sendConsoleCommand(trimmed)
      history.value.push(trimmed)
      historyIndex = history.value.length
      // Surface the server's reaction without waiting for the next tick
      void fetchOnce()
    } catch (e) {
      sendError.value = e instanceof Error ? e.message : String(e)
    } finally {
      sending.value = false
    }
  }

  function historyUp(current: string): string {
    if (!history.value.length) return current
    historyIndex = Math.max(0, historyIndex - 1)
    return history.value[historyIndex] ?? current
  }

  function historyDown(current: string): string {
    if (historyIndex >= history.value.length - 1) {
      historyIndex = history.value.length
      return ''
    }
    historyIndex += 1
    return history.value[historyIndex] ?? current
  }

  onMounted(async () => {
    await fetchOnce()
    timer = setInterval(() => void fetchOnce(), POLL_MS)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return {
    lines,
    loading,
    error,
    sending,
    sendError,
    send,
    historyUp,
    historyDown,
  }
}
