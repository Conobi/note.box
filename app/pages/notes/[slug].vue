<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const noteSlug = computed(() => route.params.slug as string)
const { getBySlug } = useNotes()

const note = computed(() => getBySlug(noteSlug.value))

useHead({
  title: computed(() => {
    const title = note.value?.title || t('editor.untitled')
    return `${title} - note.box`
  }),
})
</script>

<template>
  <NoteEditor :key="noteSlug" :note-slug="noteSlug" />
</template>
