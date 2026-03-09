<script setup lang="ts">
const route = useRoute()
const noteSlug = computed(() => route.params.slug as string)
</script>

<template>
  <div>
    <NoteEditor :key="noteSlug" :note-slug="noteSlug" />
  </div>
</template>
