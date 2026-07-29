<template>
  <div class="flex items-center gap-2 px-4 py-2 border-b border-base-300 bg-base-100 text-sm">
    <select
      class="select select-bordered select-xs mr-2"
      :value="currentEnvironment"
      @change="onEnvironmentChange"
    >
      <option v-for="e in environments" :key="e.id" :value="e.id">
        {{ e.label }}
      </option>
    </select>

    <span class="opacity-60 mr-2">Statut</span>
    <span
      class="badge badge-sm gap-1"
      :class="health?.loki.ok ? 'badge-success' : 'badge-error'"
    >
      Loki
      <span class="opacity-70">{{ health?.loki.ok ? 'OK' : 'DOWN' }}</span>
    </span>
    <span
      class="badge badge-sm gap-1"
      :class="health?.prometheus.ok ? 'badge-success' : 'badge-error'"
    >
      Prometheus
      <span class="opacity-70">{{ health?.prometheus.ok ? 'OK' : 'DOWN' }}</span>
    </span>
    <span v-if="error" class="text-error text-xs truncate ml-2">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
import { useHealth } from '@/composables/useHealth'
import { useEnvironment } from '@/composables/useEnvironment'

const { health, error } = useHealth()
const { currentEnvironment, environments, setEnvironment } = useEnvironment()

function onEnvironmentChange(e: Event) {
  setEnvironment((e.target as HTMLSelectElement).value)
}
</script>
