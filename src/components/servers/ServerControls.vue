<template>
  <section class="space-y-3">
    <div class="flex items-end justify-between gap-4">
      <h3 class="text-lg font-semibold">Serveurs</h3>
      <span v-if="loading && !servers.length" class="loading loading-spinner loading-sm opacity-50" />
    </div>

    <div v-if="error" class="alert alert-error text-sm">
      <span>{{ error }}</span>
    </div>
    <div v-if="actionError" class="alert alert-error text-sm">
      <span>{{ actionError }}</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ServerCard
        v-for="server in servers"
        :key="server.id"
        :server="server"
        :busy="busyId === server.id"
        @action="(action) => askConfirmation(server, action)"
      />
    </div>

    <dialog ref="dialog" class="modal" @close="pending = null">
      <div v-if="pending" class="modal-box">
        <h3 class="font-semibold text-lg">{{ confirmTitle }}</h3>
        <p class="py-4 text-sm opacity-80">{{ confirmMessage }}</p>
        <div class="modal-action">
          <button class="btn btn-sm" @click="closeDialog">Annuler</button>
          <button class="btn btn-sm" :class="confirmButtonClass" @click="confirm">
            {{ confirmButtonLabel }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ServerCard from './ServerCard.vue'
import { useServers } from '@/composables/useServers'
import type { ServerAction, ServerStatus } from '@/types/api'

const { servers, loading, error, busyId, actionError, runAction } = useServers()

const dialog = ref<HTMLDialogElement | null>(null)
const pending = ref<{ server: ServerStatus; action: ServerAction } | null>(null)

const ACTION_LABELS: Record<ServerAction, string> = {
  start: 'Démarrer',
  stop: 'Arrêter',
  restart: 'Redémarrer',
}

function askConfirmation(server: ServerStatus, action: ServerAction) {
  // Starting a stopped server disconnects nobody, so skip the prompt.
  if (action === 'start') {
    void runAction(server.id, action)
    return
  }
  pending.value = { server, action }
  dialog.value?.showModal()
}

function closeDialog() {
  dialog.value?.close()
}

function confirm() {
  const current = pending.value
  closeDialog()
  if (current) void runAction(current.server.id, current.action)
}

const confirmTitle = computed(() =>
  pending.value ? `${ACTION_LABELS[pending.value.action]} ${pending.value.server.label} ?` : '',
)

const confirmMessage = computed(() => {
  if (!pending.value) return ''
  const { action, server } = pending.value
  const suffix = `Unité systemd : ${server.unit}.`
  return action === 'stop'
    ? `Les joueurs connectés seront déconnectés et le serveur restera hors ligne. ${suffix}`
    : `Les joueurs connectés seront déconnectés le temps du redémarrage. ${suffix}`
})

const confirmButtonLabel = computed(() =>
  pending.value ? ACTION_LABELS[pending.value.action] : '',
)

const confirmButtonClass = computed(() =>
  pending.value?.action === 'stop' ? 'btn-error' : 'btn-warning',
)
</script>
