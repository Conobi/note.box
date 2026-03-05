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

const preview = computed(() => extractText(props.note.content, 80, { skipFirstHeading: true }))

const formattedDate = computed(() => {
  const date = new Date(props.note.updatedAt)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
})
</script>

<template>
  <NuxtLink
    :to="`/notes/${note.id}`"
    class="block p-3 rounded-lg transition-colors"
    :class="active
      ? (expanded ? 'bg-elevated' : 'group-hover/sidebar:bg-elevated')
      : (expanded ? 'hover:bg-elevated/50' : 'group-hover/sidebar:hover:bg-elevated/50')"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0 flex-1">
        <p :class="['font-medium text-sm transition-colors duration-300 truncate', expanded ? 'text-highlighted' : 'text-dimmed group-hover/sidebar:text-highlighted']">
          {{ note.title }}
        </p>
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
