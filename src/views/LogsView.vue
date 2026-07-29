<template>
  <div class="p-6 space-y-4 h-full min-h-0 flex flex-col">
    <div class="flex items-end justify-between gap-4 flex-wrap">
      <h2 class="text-2xl font-semibold">Logs</h2>
      <span v-if="loading" class="loading loading-spinner loading-sm opacity-50" />
    </div>

    <LogFilters
      v-model:filter="filter"
      v-model:level="level"
      :paused="paused"
      :available-mods="availableMods"
      :selected-mods="selectedMods"
      :source="source"
      :log-files="logFiles"
      @toggle-pause="togglePause"
      @mods-all="selectAllMods"
      @mods-none="selectNoMods"
      @toggle-mod="toggleMod"
      @select-source="selectSource"
    />

    <LogViewer class="flex-1" :lines="visibleLines" :error="error" :paused="paused" />
  </div>
</template>

<script setup lang="ts">
import LogFilters from '@/components/logs/LogFilters.vue'
import LogViewer from '@/components/logs/LogViewer.vue'
import { useLogs } from '@/composables/useLogs'

const {
  visibleLines,
  filter,
  level,
  selectedMods,
  availableMods,
  paused,
  loading,
  error,
  source,
  logFiles,
  togglePause,
  selectAllMods,
  selectNoMods,
  toggleMod,
  selectSource,
} = useLogs()
</script>
