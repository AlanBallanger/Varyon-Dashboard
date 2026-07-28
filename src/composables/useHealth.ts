import { onMounted, onUnmounted, ref } from 'vue'
import { api } from '@/services/api'
import type { HealthStatus } from '@/types/api'

export function useHealth(pollMs = 10_000) {
  const health = ref<HealthStatus | null>(null)
  const error = ref<string | null>(null)
  let timer: ReturnType<typeof setInterval> | undefined

  async function refresh() {
    try {
      health.value = await api.getHealth()
      error.value = null
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    }
  }

  onMounted(() => {
    void refresh()
    timer = setInterval(() => void refresh(), pollMs)
  })
  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return { health, error, refresh }
}
