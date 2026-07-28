<template>
  <div class="font-mono text-xs leading-5 flex gap-3 px-3 py-0.5 hover:bg-base-200/60">
    <span class="opacity-40 shrink-0 tabular-nums w-[72px]">{{ timeLabel }}</span>
    <span class="shrink-0 w-14 font-semibold" :class="levelClass">{{ line.level }}</span>
    <span class="break-all whitespace-pre-wrap">{{ line.line }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LogLine } from '@/types/api'

const props = defineProps<{ line: LogLine }>()

const timeLabel = computed(() => {
  try {
    return new Date(props.line.ts).toLocaleTimeString('fr-FR', { hour12: false })
  } catch {
    return props.line.ts
  }
})

const levelClass = computed(() => {
  switch (props.line.level) {
    case 'ERROR':
      return 'text-error'
    case 'WARN':
      return 'text-warning'
    case 'INFO':
      return 'text-info/80'
    default:
      return 'opacity-50'
  }
})
</script>
