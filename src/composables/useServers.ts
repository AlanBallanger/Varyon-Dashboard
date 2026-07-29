import { onMounted, onUnmounted, ref } from 'vue'
import { api } from '@/services/api'
import type { ServerAction, ServerStatus } from '@/types/api'

const POLL_MS = 5000

export function useServers() {
  const servers = ref<ServerStatus[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  /** Server id currently running an action, so its card can show a spinner. */
  const busyId = ref<string | null>(null)
  const actionError = ref<string | null>(null)

  let timer: ReturnType<typeof setInterval> | undefined

  async function refresh() {
    loading.value = true
    try {
      const result = await api.getServers()
      servers.value = result.servers
      error.value = null
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  async function runAction(id: string, action: ServerAction) {
    if (busyId.value) return
    busyId.value = id
    actionError.value = null
    try {
      await api.runServerAction(id, action)
      // systemd returns as soon as the job is queued; the unit needs a moment
      // to settle, so re-check a few times instead of trusting the first read.
      for (const delay of [1000, 3000, 5000]) {
        await new Promise((r) => setTimeout(r, delay))
        await refresh()
      }
    } catch (e) {
      actionError.value = e instanceof Error ? e.message : String(e)
      await refresh()
    } finally {
      busyId.value = null
    }
  }

  onMounted(async () => {
    await refresh()
    timer = setInterval(() => void refresh(), POLL_MS)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return { servers, loading, error, busyId, actionError, refresh, runAction }
}
