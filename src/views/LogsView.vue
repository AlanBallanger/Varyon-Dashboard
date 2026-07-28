<template>
  <div class="p-6 space-y-4 h-full flex flex-col">
    <div class="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h2 class="text-2xl font-semibold">Logs</h2>
        <p class="text-sm opacity-60 mt-1">
          Sélecteur :
          <code class="text-xs bg-base-200 px-1.5 py-0.5 rounded">{{ selector || '…' }}</code>
        </p>
      </div>
      <span v-if="loading" class="loading loading-spinner loading-sm opacity-50" />
    </div>

    <LogFilters
      v-model:filter="filter"
      v-model:level="level"
      v-model:live="live"
      :paused="paused"
      @toggle-pause="togglePause"
    />

    <LogViewer class="flex-1" :lines="lines" :error="error" :paused="paused" />
  </div>
</template>

<script setup lang="ts">
import LogFilters from '@/components/logs/LogFilters.vue'
import LogViewer from '@/components/logs/LogViewer.vue'
import { useLogs } from '@/composables/useLogs'

const {
  lines,
  filter,
  level,
  live,
  paused,
  loading,
  error,
  selector,
  togglePause,
} = useLogs()
</script>
