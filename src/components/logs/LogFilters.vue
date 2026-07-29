<template>
  <div class="flex flex-wrap items-center gap-3">
    <select
      class="select select-bordered select-sm max-w-[260px]"
      :value="source"
      @change="onSource"
    >
      <option :value="LIVE_SOURCE">Live (Loki)</option>
      <option v-for="file in logFiles" :key="file.name" :value="file.name">
        {{ file.name }}
      </option>
    </select>

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

    <details class="dropdown">
      <summary class="btn btn-sm">
        Mods
        <span class="opacity-70 font-normal">{{ modBadge }}</span>
      </summary>
      <div
        class="dropdown-content z-30 mt-1 p-2 shadow-lg bg-base-200 border border-base-300 rounded-box w-64 max-h-72 overflow-auto"
      >
        <div class="flex gap-2 mb-2">
          <button class="btn btn-xs flex-1" type="button" @click.stop="$emit('mods-all')">
            Tout
          </button>
          <button class="btn btn-xs flex-1" type="button" @click.stop="$emit('mods-none')">
            Aucun
          </button>
        </div>
        <p v-if="!availableMods.length" class="text-xs opacity-50 px-1 py-2">
          Aucun mod détecté pour l’instant.
        </p>
        <label
          v-for="mod in availableMods"
          :key="mod"
          class="flex items-center gap-2 px-1 py-1.5 rounded hover:bg-base-300 cursor-pointer text-sm"
        >
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            :checked="isModChecked(mod)"
            @change="onModToggle(mod, $event)"
          />
          <span class="truncate">{{ mod }}</span>
        </label>
      </div>
    </details>

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
import { computed } from 'vue'
import type { LogFileInfo, LogLevel } from '@/types/api'
import { LIVE_SOURCE } from '@/composables/useLogs'

const props = defineProps<{
  filter: string
  level: LogLevel
  live: boolean
  paused: boolean
  availableMods: string[]
  /** null = all selected */
  selectedMods: string[] | null
  source: string
  logFiles: LogFileInfo[]
}>()

const emit = defineEmits<{
  'update:filter': [value: string]
  'update:level': [value: LogLevel]
  'update:live': [value: boolean]
  'toggle-pause': []
  'mods-all': []
  'mods-none': []
  'toggle-mod': [mod: string, checked: boolean]
  'select-source': [name: string]
}>()

function onSource(e: Event) {
  emit('select-source', (e.target as HTMLSelectElement).value)
}

const modBadge = computed(() => {
  const total = props.availableMods.length
  if (!total) return '0'
  if (props.selectedMods === null) return `${total}/${total}`
  return `${props.selectedMods.length}/${total}`
})

function isModChecked(mod: string) {
  if (props.selectedMods === null) return true
  return props.selectedMods.includes(mod)
}

function onModToggle(mod: string, e: Event) {
  emit('toggle-mod', mod, (e.target as HTMLInputElement).checked)
}

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
