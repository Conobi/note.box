<script setup lang="ts">
import type { Note } from '~/types/note'

const props = defineProps<{
  note: Note
  active: boolean
}>()

defineEmits<{
  delete: [id: string]
}>()

const expanded = inject('sidebarExpanded', false)

const titleRef = ref<HTMLElement | null>(null)
const isTruncated = ref(false)

function checkTruncation() {
  const el = titleRef.value
  if (!el) return
  isTruncated.value = el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight
}

let resizeObserver: ResizeObserver | null = null

watch(() => props.note.title, () => nextTick(checkTruncation))

onMounted(() => {
  nextTick(checkTruncation)
  resizeObserver = new ResizeObserver(checkTruncation)
  if (titleRef.value) {
    resizeObserver.observe(titleRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

const preview = computed(() => extractText(props.note.content, 80, { skipFirstHeading: true }))

const formattedDate = computed(() => {
  const date = new Date(props.note.updatedAt)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
})
</script>

<template>
  <NuxtLink
    :to="`/notes/${note.slug}`"
    class="block p-3 rounded-lg transition-colors"
    :class="active
      ? (expanded ? 'bg-elevated' : 'group-hover/sidebar:bg-elevated')
      : (expanded ? 'hover:bg-elevated/50' : 'group-hover/sidebar:hover:bg-elevated/50')"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0 flex-1">
        <UTooltip :text="note.title" :disabled="!isTruncated" :delay-duration="400">
          <p
            ref="titleRef"
            :class="['font-medium text-sm transition-colors duration-300', expanded ? 'line-clamp-2 text-highlighted' : 'truncate text-dimmed group-hover/sidebar:text-highlighted']"
          >
            {{ note.title }}
          </p>
        </UTooltip>
        <p :class="['text-xs transition-colors duration-300 mt-1 line-clamp-2', expanded ? 'text-muted' : 'text-dimmed group-hover/sidebar:text-muted']">
          {{ preview }}
        </p>
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <span class="text-xs text-dimmed">{{ formattedDate }}</span>
        <UButton
          icon="i-lucide-trash-2"
          size="xs"
          color="neutral"
          variant="ghost"
          aria-label="Delete note"
          class="opacity-0 group-hover/item:opacity-100"
          @click.prevent="$emit('delete', note.id)"
        />
      </div>
    </div>
  </NuxtLink>
</template>
