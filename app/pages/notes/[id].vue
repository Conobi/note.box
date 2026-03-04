<script setup lang="ts">
const route = useRoute()
const noteId = computed(() => route.params.id as string)
</script>

<template>
  <NoteEditor :key="noteId" :note-id="noteId" />
</template>
