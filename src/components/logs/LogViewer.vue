<template>
  <div class="flex flex-col h-full min-h-0 border border-base-300 rounded-lg overflow-hidden bg-base-200/40">
    <div
      v-if="error"
      class="alert alert-error rounded-none text-sm"
    >
      <span>{{ error }}</span>
    </div>

    <div
      ref="scroller"
      class="flex-1 overflow-auto py-1"
      @scroll="onScroll"
    >
      <div v-if="!lines.length && !error" class="p-6 text-sm opacity-60">
        Aucune ligne pour ce filtre / sélecteur.
      </div>
      <LogLineRow v-for="(line, i) in lines" :key="`${line.ts}-${i}`" :line="line" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { LogLine } from '@/types/api'
import LogLineRow from './LogLine.vue'

const props = defineProps<{
  lines: LogLine[]
  error: string | null
  paused: boolean
}>()

const scroller = ref<HTMLElement | null>(null)
const stickToBottom = ref(true)

function onScroll() {
  const el = scroller.value
  if (!el) return
  const distance = el.scrollHeight - el.scrollTop - el.clientHeight
  stickToBottom.value = distance < 48
}

watch(
  () => props.lines.length,
  async () => {
    if (!stickToBottom.value || props.paused) return
    await nextTick()
    const el = scroller.value
    if (el) el.scrollTop = el.scrollHeight
  },
)
</script>
