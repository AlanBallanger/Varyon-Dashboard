<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h2 class="text-2xl font-semibold">Mods</h2>
        <p v-if="data" class="text-sm opacity-60 mt-1">
          Chemin : <code class="text-xs">{{ data.path }}</code>
        </p>
      </div>
      <button class="btn btn-sm" type="button" :disabled="loading" @click="refresh">
        Actualiser
      </button>
    </div>

    <div v-if="error" class="alert alert-error text-sm">
      <span>{{ error }}</span>
    </div>

    <div v-else-if="data && !data.mods.length" class="text-sm opacity-60">
      Aucun mod trouvé dans ce dossier.
    </div>

    <div v-else-if="data" class="overflow-x-auto">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Type</th>
            <th>Taille</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="mod in data.mods" :key="mod.path">
            <td>{{ mod.name }}</td>
            <td>{{ mod.kind === 'directory' ? 'Dossier' : 'Fichier' }}</td>
            <td>{{ formatSize(mod.sizeBytes) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMods } from '@/composables/useMods'

const { data, error, loading, refresh } = useMods()

function formatSize(bytes?: number) {
  if (bytes === undefined) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>
