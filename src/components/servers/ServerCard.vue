<template>
  <div class="card bg-base-200 border border-base-300 shadow">
    <div class="card-body gap-3 p-5">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h3 class="font-semibold truncate">{{ server.label }}</h3>
          <p class="text-xs opacity-50 font-mono truncate">{{ server.unit }}</p>
        </div>
        <span class="badge badge-sm shrink-0 gap-1.5" :class="badgeClass">
          <span class="inline-block w-1.5 h-1.5 rounded-full bg-current" />
          {{ stateLabel }}
        </span>
      </div>

      <p class="text-xs opacity-60 min-h-4">
        <template v-if="server.error">Statut indisponible</template>
        <template v-else-if="server.running && uptime">Actif depuis {{ uptime }}</template>
      </p>

      <div class="card-actions">
        <button
          class="btn btn-sm btn-success flex-1"
          :disabled="busy || server.running"
          @click="$emit('action', 'start')"
        >
          <span v-if="busy" class="loading loading-spinner loading-xs" />
          Démarrer
        </button>
        <button
          class="btn btn-sm flex-1"
          :disabled="busy || !server.running"
          @click="$emit('action', 'restart')"
        >
          Redémarrer
        </button>
        <button
          class="btn btn-sm btn-error flex-1"
          :disabled="busy || !server.running"
          @click="$emit('action', 'stop')"
        >
          Arrêter
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ServerAction, ServerStatus } from '@/types/api'

const props = defineProps<{
  server: ServerStatus
  busy: boolean
}>()

defineEmits<{ action: [action: ServerAction] }>()

const stateLabel = computed(() => {
  if (props.server.error) return 'Inconnu'
  switch (props.server.activeState) {
    case 'active':
      return 'En ligne'
    case 'activating':
      return 'Démarrage…'
    case 'deactivating':
      return 'Arrêt…'
    case 'failed':
      return 'En échec'
    case 'inactive':
      return 'Arrêté'
    default:
      return props.server.activeState
  }
})

const badgeClass = computed(() => {
  if (props.server.error) return 'badge-ghost'
  switch (props.server.activeState) {
    case 'active':
      return 'badge-success'
    case 'activating':
    case 'deactivating':
      return 'badge-warning'
    case 'failed':
      return 'badge-error'
    default:
      return 'badge-ghost'
  }
})

const uptime = computed(() => {
  if (!props.server.activeSinceMs) return ''
  const totalMinutes = Math.floor((Date.now() - props.server.activeSinceMs) / 60_000)
  if (totalMinutes < 1) return "moins d'une minute"
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60
  if (days) return `${days} j ${hours} h`
  if (hours) return `${hours} h ${minutes} min`
  return `${minutes} min`
})
</script>
