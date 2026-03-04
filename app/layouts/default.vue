<script setup lang="ts">
const sidebarOpen = ref(true)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}
</script>

<template>
  <div class="h-screen flex bg-default">
    <!-- Sidebar -->
    <aside
      class="border-r border-default flex flex-col shrink-0 transition-all duration-200 overflow-hidden"
      :class="sidebarOpen ? 'w-72' : 'w-0'"
    >
      <div class="p-3 flex items-center justify-between border-b border-default">
        <h1 class="font-bold text-base text-highlighted">
          note.box
        </h1>
        <div class="flex items-center gap-1">
          <ColorModeToggle />
          <UButton
            icon="i-lucide-panel-left-close"
            size="xs"
            color="neutral"
            variant="ghost"
            @click="toggleSidebar"
          />
        </div>
      </div>
      <NoteList />
    </aside>

    <!-- Main content -->
    <main class="flex-1 flex flex-col min-w-0">
      <div v-if="!sidebarOpen" class="p-2 border-b border-default">
        <UButton
          icon="i-lucide-panel-left-open"
          size="xs"
          color="neutral"
          variant="ghost"
          @click="toggleSidebar"
        />
      </div>
      <div class="flex-1 overflow-y-auto">
        <slot />
      </div>
    </main>
  </div>
</template>
