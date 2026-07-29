<template>
  <div
    class="font-mono text-xs leading-5 flex gap-3 px-3 py-0.5 hover:bg-base-200/60"
    :class="{ 'cursor-pointer': isLong }"
    @click="isLong && (expanded = !expanded)"
  >
    <span class="opacity-40 shrink-0 tabular-nums w-[72px]">{{ timeLabel }}</span>
    <span class="shrink-0 w-14 font-semibold" :class="levelClass">{{ line.level }}</span>
    <span
      class="shrink-0 w-40 truncate"
      :style="tagStyle"
      :title="tag ?? undefined"
    >{{ tag ?? '' }}</span>
    <span
      class="break-all min-w-0 flex-1"
      :class="expanded || !isLong ? 'whitespace-pre-wrap' : 'truncate'"
    >{{ message }}</span>
    <span v-if="isLong" class="shrink-0 opacity-30 select-none">{{ expanded ? '⌃' : '⌄' }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { LogLine } from '@/types/api'
import { formatLogLine, tagHue } from '@/utils/logFormat'

/** Beyond this, a line is collapsed until clicked. */
const LONG_LINE_CHARS = 160

const props = defineProps<{ line: LogLine }>()

const expanded = ref(false)

const formatted = computed(() => formatLogLine(props.line.line))
const tag = computed(() => formatted.value.tag)
const message = computed(() => formatted.value.message)
const isLong = computed(() => message.value.length > LONG_LINE_CHARS)

const tagStyle = computed(() => {
  if (!tag.value) return undefined
  // Fixed saturation/lightness keeps every hue legible on the dark theme.
  return { color: `hsl(${tagHue(tag.value)} 55% 68%)` }
})

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
