<template>
  <aside class="w-56 shrink-0 bg-base-200 border-r border-base-300 flex flex-col min-h-screen">
    <div class="px-4 py-5 border-b border-base-300">
      <p class="text-xs uppercase tracking-widest opacity-60">Varyon</p>
      <h1 class="text-lg font-semibold leading-tight">Dev Dashboard</h1>
    </div>

    <nav class="flex-1 p-2 space-y-0.5">
      <router-link
        v-for="item in activeItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-base-300 transition-colors"
        active-class="bg-primary text-primary-content hover:bg-primary"
      >
        <component :is="item.icon" class="w-4 h-4" />
        <span>{{ item.label }}</span>
      </router-link>

      <div class="pt-3 pb-1 px-3 text-[10px] uppercase tracking-wider opacity-40">Bientôt</div>
      <div
        v-for="item in soonItems"
        :key="item.label"
        class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm opacity-40 cursor-not-allowed"
      >
        <component :is="item.icon" class="w-4 h-4" />
        <span>{{ item.label }}</span>
      </div>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import {
  IconFileText,
  IconUsers,
  IconPuzzle,
  IconTerminal2,
  IconGauge,
  IconDatabase,
  IconCpu,
  IconFlame,
  IconBinaryTree,
  IconDeviceFloppy,
  IconCalendarEvent,
} from '@tabler/icons-vue'

const activeItems = [
  { to: '/logs', label: 'Logs', icon: IconFileText },
  { to: '/joueurs', label: 'Joueurs', icon: IconUsers },
  { to: '/mods', label: 'Mods', icon: IconPuzzle },
]

const soonItems = [
  { label: 'Console', icon: IconTerminal2 },
  { label: 'TPS', icon: IconGauge },
  { label: 'RAM', icon: IconDatabase },
  { label: 'CPU', icon: IconCpu },
  { label: 'Spark', icon: IconFlame },
  { label: 'Threads', icon: IconBinaryTree },
  { label: 'World Save', icon: IconDeviceFloppy },
  { label: 'Scheduler', icon: IconCalendarEvent },
]
</script>
