<script setup lang="ts">
const { t } = useI18n()
const router = useRouter()
const { create } = useNotes()

function createNote() {
  const note = create()
  router.push(`/notes/${note.slug}`)
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 text-center p-8 min-h-[70vh]">
    <UIcon name="i-lucide-pen-line" class="size-16 text-dimmed" />
    <div>
      <h2 class="text-lg font-semibold text-highlighted">{{ t('emptyState.heading') }}</h2>
      <p class="text-sm text-muted mt-1">{{ t('emptyState.description') }}</p>
    </div>
    <UTooltip :text="t('app.newNote')" :kbds="isMac() ? ['meta', 'N'] : ['meta', 'shift', 'N']">
      <UButton :label="t('emptyState.newNote')" icon="i-lucide-plus" size="md" @click="createNote" />
    </UTooltip>
  </div>
</template>
