<script setup lang="ts">
const colorMode = useColorMode()
const { font, colorScheme } = useAppSettings()
const settingsOpen = ref(false)

watch(colorScheme, (scheme) => {
  colorMode.preference = scheme
}, { immediate: true })
</script>

<template>
  <div :class="['min-h-screen bg-default flex', `font-${font}`]">
    <!-- Persistent sidebar — dims when not hovered -->
    <aside class="group/sidebar w-55 shrink-0 flex flex-col bg-default border-r border-transparent hover:border-default transition-[border-color] duration-300">
      <div class="p-3 flex items-center justify-between">
        <h1 class="font-bold text-base text-dimmed group-hover/sidebar:text-highlighted transition-colors duration-300">
          note.box
        </h1>
        <div class="flex items-center gap-0.5 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
          <NoteCreateButton />
          <UButton
            icon="i-lucide-settings"
            size="sm"
            color="neutral"
            variant="ghost"
            @click="settingsOpen = true"
          />
        </div>
        <SettingsModal v-model:open="settingsOpen" />
      </div>
      <NoteList />
    </aside>

    <!-- Main content -->
    <main class="flex-1 min-w-0 max-w-2xl mx-auto px-4 pb-10">
      <slot />
    </main>
  </div>
</template>
