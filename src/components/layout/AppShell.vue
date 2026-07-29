<template>
  <div class="flex min-h-screen bg-base-100 text-base-content">
    <Sidebar />
    <div class="flex-1 flex flex-col min-w-0 h-screen">
      <StatusBar />
      <main class="flex-1 min-h-0 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import Sidebar from './Sidebar.vue'
import StatusBar from './StatusBar.vue'
</script>
