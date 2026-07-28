<template>
  <div class="flex min-h-screen bg-base-100 text-base-content">
    <Sidebar />
    <div class="flex-1 flex flex-col min-w-0">
      <StatusBar />
      <main class="flex-1 overflow-auto">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import Sidebar from './Sidebar.vue'
import StatusBar from './StatusBar.vue'
</script>
