import { onMounted, onUnmounted, ref } from 'vue'
import { api } from '@/services/api'
import type { PlayersResponse } from '@/types/api'

export function usePlayers(pollMs = 5000) {
  const data = ref<PlayersResponse | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)
  let timer: ReturnType<typeof setInterval> | undefined

  async function refresh() {
    loading.value = true
    try {
      data.value = await api.getPlayers()
      error.value = null
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  onMounted(async () => {
    try {
      const cfg = await api.getPublicConfig()
      pollMs = cfg.playersPollMs
    } catch {
      /* default */
    }
    await refresh()
    timer = setInterval(() => void refresh(), pollMs)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return { data, error, loading, refresh }
}
