<script setup lang="ts">
const router = useRouter()
const { create } = useNotes()

function createNote() {
  const note = create()
  router.push(`/notes/${note.id}`)
}
</script>

<template>
  <UButton
    icon="i-lucide-plus"
    size="sm"
    color="neutral"
    variant="ghost"
    @click="createNote"
  />
</template>
