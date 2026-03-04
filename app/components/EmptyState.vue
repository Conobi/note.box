<script setup lang="ts">
const router = useRouter()
const { create } = useNotes()

function createNote() {
  const note = create()
  router.push(`/notes/${note.id}`)
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 text-center p-8 min-h-[70vh]">
    <UIcon name="i-lucide-pen-line" class="size-16 text-dimmed" />
    <div>
      <h2 class="text-lg font-semibold text-highlighted">Start writing</h2>
      <p class="text-sm text-muted mt-1">Create a new note and let your thoughts flow.</p>
    </div>
    <UButton label="New note" icon="i-lucide-plus" size="md" @click="createNote" />
  </div>
</template>
