import { ref } from 'vue'
import { api } from '@/services/api'

export function useConsole() {
  const sending = ref(false)
  const sendError = ref<string | null>(null)
  const history = ref<string[]>([])
  let historyIndex = -1

  async function send(command: string) {
    const trimmed = command.trim()
    if (!trimmed || sending.value) return
    sending.value = true
    sendError.value = null
    try {
      await api.sendConsoleCommand(trimmed)
      history.value.push(trimmed)
      historyIndex = history.value.length
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

  return { sending, sendError, send, historyUp, historyDown }
}
