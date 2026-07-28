<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between gap-4">
      <h2 class="text-2xl font-semibold">Joueurs</h2>
      <button class="btn btn-sm" type="button" :disabled="loading" @click="refresh">
        Actualiser
      </button>
    </div>

    <div v-if="error" class="alert alert-error text-sm">
      <span>{{ error }}</span>
    </div>

    <div v-else-if="data?.missingMetric" class="alert alert-warning text-sm">
      <span>
        Métrique introuvable :
        <code class="mx-1">{{ data.metric }}</code>.
        Vérifie <code>PLAYERS_PROMQL</code> / Prometheus.
      </span>
    </div>

    <div v-else class="stats bg-base-200 shadow">
      <div class="stat">
        <div class="stat-title">En ligne</div>
        <div class="stat-value">{{ data?.count ?? '—' }}</div>
        <div class="stat-desc">
          Métrique <code class="text-xs">{{ data?.metric }}</code>
        </div>
      </div>
    </div>

    <div v-if="data && data.players.length" class="overflow-x-auto">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Joueur</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in data.players" :key="p.name">
            <td>{{ p.name }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlayers } from '@/composables/usePlayers'

const { data, error, loading, refresh } = usePlayers()
</script>
