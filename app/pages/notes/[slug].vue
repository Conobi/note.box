<script setup lang="ts">
const route = useRoute()
const noteSlug = computed(() => route.params.slug as string)
const { getBySlug } = useNotes()

const note = computed(() => getBySlug(noteSlug.value))

useHead({
  title: computed(() => {
    const title = note.value?.title || 'Untitled'
    return `${title} - note.box`
  }),
})
</script>

<template>
  <NoteEditor :key="noteSlug" :note-slug="noteSlug" />
</template>
