<script setup lang="ts">
import type { WritingFont, ColorScheme } from '~/types/settings'
import type { Note } from '~/types/note'

const open = defineModel<boolean>('open', { default: false })

const { font, colorScheme } = useAppSettings()
const { notes } = useNotes()
const exporting = ref(false)

const fontOptions: { label: string, value: WritingFont }[] = [
  { label: 'Sans', value: 'sans' },
  { label: 'Serif', value: 'serif' },
  { label: 'Mono', value: 'mono' },
]

const themeOptions: { label: string, value: ColorScheme, icon: string }[] = [
  { label: 'Light', value: 'light', icon: 'i-lucide-sun' },
  { label: 'Dark', value: 'dark', icon: 'i-lucide-moon' },
  { label: 'Sepia', value: 'sepia', icon: 'i-lucide-coffee' },
]

async function handleExport() {
  exporting.value = true
  try {
    await exportNotesAsZip(notes.value as Note[])
  }
  finally {
    exporting.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Settings" :ui="{ footer: 'justify-end' }">
    <template #body>
      <div class="flex flex-col gap-5">
        <div>
          <p class="text-sm font-medium text-muted mb-2">
            Font
          </p>
          <div class="flex gap-2">
            <UButton
              v-for="opt in fontOptions"
              :key="opt.value"
              :label="opt.label"
              size="sm"
              :color="font === opt.value ? 'primary' : 'neutral'"
              :variant="font === opt.value ? 'subtle' : 'ghost'"
              @click="font = opt.value"
            />
          </div>
        </div>

        <div>
          <p class="text-sm font-medium text-muted mb-2">
            Theme
          </p>
          <div class="flex gap-2">
            <UButton
              v-for="opt in themeOptions"
              :key="opt.value"
              :icon="opt.icon"
              :label="opt.label"
              size="sm"
              :color="colorScheme === opt.value ? 'primary' : 'neutral'"
              :variant="colorScheme === opt.value ? 'subtle' : 'ghost'"
              @click="colorScheme = opt.value"
            />
          </div>
        </div>

        <USeparator />

        <UButton
          icon="i-lucide-download"
          label="Export all notes"
          variant="soft"
          color="neutral"
          size="sm"
          block
          :loading="exporting"
          :disabled="!notes.length"
          @click="handleExport"
        />
      </div>
    </template>
  </UModal>
</template>
