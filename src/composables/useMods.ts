import { onMounted, ref } from 'vue'
import { api } from '@/services/api'
import type { ModsResponse } from '@/types/api'

export function useMods() {
  const data = ref<ModsResponse | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  async function refresh() {
    loading.value = true
    try {
      data.value = await api.getMods()
      error.value = null
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    void refresh()
  })

  return { data, error, loading, refresh }
}
