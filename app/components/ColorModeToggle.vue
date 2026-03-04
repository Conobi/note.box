<script setup lang="ts">
import { useColorMode } from '#imports'

const colorMode = useColorMode()

function toggle() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <UButton
    :icon="colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'"
    size="xs"
    color="neutral"
    variant="ghost"
    @click="toggle"
  />
</template>
