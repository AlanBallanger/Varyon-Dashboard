<template>
  <div class="flex flex-wrap items-center gap-3">
    <label class="input input-bordered input-sm flex items-center gap-2 min-w-[220px] flex-1">
      <input
        :value="filter"
        type="text"
        class="grow"
        placeholder="Filtrer le texte…"
        @input="onFilter"
      />
    </label>

    <select
      class="select select-bordered select-sm"
      :value="level"
      @change="onLevel"
    >
      <option value="ALL">Tous niveaux</option>
      <option value="INFO">INFO</option>
      <option value="WARN">WARN</option>
      <option value="ERROR">ERROR</option>
    </select>

    <label class="label cursor-pointer gap-2 py-0">
      <span class="label-text text-sm">Live</span>
      <input
        type="checkbox"
        class="toggle toggle-sm toggle-success"
        :checked="live"
        @change="onLive"
      />
    </label>

    <button class="btn btn-sm" type="button" @click="$emit('toggle-pause')">
      {{ paused ? 'Reprendre' : 'Pause' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { LogLevel } from '@/types/api'

defineProps<{
  filter: string
  level: LogLevel
  live: boolean
  paused: boolean
}>()

const emit = defineEmits<{
  'update:filter': [value: string]
  'update:level': [value: LogLevel]
  'update:live': [value: boolean]
  'toggle-pause': []
}>()

function onFilter(e: Event) {
  emit('update:filter', (e.target as HTMLInputElement).value)
}

function onLevel(e: Event) {
  emit('update:level', (e.target as HTMLSelectElement).value as LogLevel)
}

function onLive(e: Event) {
  emit('update:live', (e.target as HTMLInputElement).checked)
}
</script>
