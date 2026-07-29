<template>
  <div class="p-6 space-y-6">
    <div>
      <h2 class="text-2xl font-semibold">Accueil</h2>
      <p class="text-sm opacity-60 mt-1">Vue d'ensemble de l'état du serveur.</p>
    </div>

    <ServerControls />

    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div class="stat bg-base-200 rounded-box shadow border border-base-300">
        <div class="stat-figure text-primary">
          <IconUsers class="w-7 h-7" />
        </div>
        <div class="stat-title">Joueurs</div>
        <div class="stat-value text-2xl">—</div>
        <div class="stat-desc">Bientôt disponible</div>
      </div>

      <div class="stat bg-base-200 rounded-box shadow border border-base-300">
        <div class="stat-figure text-primary">
          <IconGauge class="w-7 h-7" />
        </div>
        <div class="stat-title">TPS</div>
        <div class="stat-value text-2xl">—</div>
        <div class="stat-desc">Bientôt disponible</div>
      </div>

      <div class="stat bg-base-200 rounded-box shadow border border-base-300">
        <div class="stat-figure text-primary">
          <IconDatabase class="w-7 h-7" />
        </div>
        <div class="stat-title">RAM</div>
        <div class="stat-value text-2xl">—</div>
        <div class="stat-desc">Bientôt disponible</div>
      </div>

      <div class="stat bg-base-200 rounded-box shadow border border-base-300">
        <div class="stat-figure text-primary">
          <IconCpu class="w-7 h-7" />
        </div>
        <div class="stat-title">CPU</div>
        <div class="stat-value text-2xl">—</div>
        <div class="stat-desc">Bientôt disponible</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconUsers, IconGauge, IconDatabase, IconCpu } from '@tabler/icons-vue'
import ServerControls from '@/components/servers/ServerControls.vue'
</script>
