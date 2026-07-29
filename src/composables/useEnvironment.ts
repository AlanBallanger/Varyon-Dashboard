import { ref } from 'vue'
import type { ServerEnvironment } from '@/types/api'

const STORAGE_KEY = 'varyon.environment'

/** Module-level shared state: per-tab (localStorage), not synced across users. */
export const currentEnvironment = ref<string>(localStorage.getItem(STORAGE_KEY) ?? 'hytale')
export const environments = ref<ServerEnvironment[]>([
  { id: 'hytale', label: 'Hytale' },
  { id: 'test', label: 'Test' },
])

let loaded = false

export function setEnvironment(id: string) {
  if (id === currentEnvironment.value) return
  localStorage.setItem(STORAGE_KEY, id)
  // Force a full reload so every composable re-fetches against the new environment
  // instead of needing bespoke watchers scattered across the app.
  window.location.reload()
}

export function useEnvironment() {
  if (!loaded) {
    loaded = true
    // Dynamic import avoids a circular dependency with services/api.ts, which
    // imports currentEnvironment from this module.
    void import('@/services/api').then(({ api }) =>
      api.getEnvironments().then((res) => {
        environments.value = res.environments
      }),
    )
  }
  return { currentEnvironment, environments, setEnvironment }
}
