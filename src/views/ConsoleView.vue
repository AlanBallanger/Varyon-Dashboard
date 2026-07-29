<template>
  <div class="p-6 space-y-4 h-full min-h-0 flex flex-col">
    <div class="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h2 class="text-2xl font-semibold">Console</h2>
        <p class="text-sm opacity-60 mt-1">Sortie temps réel du serveur</p>
      </div>
      <span v-if="loading" class="loading loading-spinner loading-sm opacity-50" />
    </div>

    <LogViewer class="flex-1" :lines="lines" :error="error" :paused="false" />

    <form class="flex items-center gap-2" @submit.prevent="onSubmit">
      <span class="font-mono text-sm opacity-60">&gt;</span>
      <input
        v-model="command"
        type="text"
        class="input input-bordered input-sm flex-1 font-mono"
        placeholder="Tapez une commande serveur…"
        autocomplete="off"
        spellcheck="false"
        :disabled="sending"
        @keydown.up.prevent="command = historyUp(command)"
        @keydown.down.prevent="command = historyDown(command)"
      />
      <button type="submit" class="btn btn-sm btn-primary" :disabled="sending || !command.trim()">
        <span v-if="sending" class="loading loading-spinner loading-xs" />
        <span v-else>Envoyer</span>
      </button>
    </form>
    <p v-if="sendError" class="text-error text-xs">{{ sendError }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import LogViewer from '@/components/logs/LogViewer.vue'
import { useConsole } from '@/composables/useConsole'

const { lines, loading, error, sending, sendError, send, historyUp, historyDown } = useConsole()

const command = ref('')

async function onSubmit() {
  await send(command.value)
  if (!sendError.value) command.value = ''
}
</script>
