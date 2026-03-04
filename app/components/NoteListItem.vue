<script setup lang="ts">
import type { Note } from '~/types/note'

const props = defineProps<{
  note: Note
  active: boolean
}>()

defineEmits<{
  delete: [id: string]
}>()

const preview = computed(() => extractText(props.note.content, 80))

const formattedDate = computed(() => {
  const date = new Date(props.note.updatedAt)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
})
</script>

<template>
  <NuxtLink
    :to="`/notes/${note.id}`"
    class="block p-3 rounded-lg transition-colors"
    :class="active ? 'bg-elevated' : 'hover:bg-elevated/50'"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0 flex-1">
        <p class="font-medium text-sm text-highlighted truncate">
          {{ note.title }}
        </p>
        <p class="text-xs text-muted mt-1 line-clamp-2">
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
          class="opacity-0 group-hover:opacity-100"
          @click.prevent="$emit('delete', note.id)"
        />
      </div>
    </div>
  </NuxtLink>
</template>
