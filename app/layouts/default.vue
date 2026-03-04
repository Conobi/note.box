<script setup lang="ts">
const route = useRoute()
const drawerOpen = ref(false)
const settingsOpen = ref(false)
const colorMode = useColorMode()
const { font, colorScheme } = useAppSettings()

watch(() => route.path, () => {
  drawerOpen.value = false
})

watch(colorScheme, (scheme) => {
  if (scheme === 'sepia') {
    colorMode.preference = 'light'
    document.documentElement.classList.add('sepia')
  }
  else {
    document.documentElement.classList.remove('sepia')
    colorMode.preference = scheme
  }
}, { immediate: true })
</script>

<template>
  <div :class="['min-h-screen bg-default', `font-${font}`]">
    <!-- Drawer for notes list -->
    <UDrawer v-model:open="drawerOpen" direction="left">
      <template #content>
        <div class="w-80 h-full flex flex-col">
          <div class="p-3 flex items-center justify-between border-b border-default">
            <h1 class="font-bold text-base text-highlighted">
              note.box
            </h1>
          </div>
          <NoteList />
        </div>
      </template>
    </UDrawer>

    <!-- Centered main content -->
    <main class="max-w-2xl mx-auto px-4 pb-20">
      <slot />
    </main>

    <!-- Floating bottom bar -->
    <div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div class="floating-bottom-bar flex items-center gap-1 px-3 py-2 rounded-xl border border-default bg-default/80 shadow-lg">
        <UButton
          icon="i-lucide-panel-left"
          size="sm"
          color="neutral"
          variant="ghost"
          @click="drawerOpen = !drawerOpen"
        />
        <NoteCreateButton />
        <USeparator orientation="vertical" class="h-5 mx-1" />
        <UButton
          icon="i-lucide-settings"
          size="sm"
          color="neutral"
          variant="ghost"
          @click="settingsOpen = true"
        />
        <SettingsModal v-model:open="settingsOpen" />
      </div>
    </div>
  </div>
</template>
