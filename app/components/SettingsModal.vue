<script setup lang="ts">
import type { WritingFont, ColorScheme } from '~/types/settings'
import type { Note } from '~/types/note'

const open = defineModel<boolean>('open', { default: false })

const { font, colorScheme } = useAppSettings()
const { notes } = useNotes()
const exporting = ref(false)

interface FontOption {
  label: string
  value: WritingFont
  family: string
  category: string
}

const fontOptions: FontOption[] = [
  { label: 'Inter', value: 'inter', family: "'Inter', sans-serif", category: 'Sans-serif' },
  { label: 'Google Sans Flex', value: 'google-sans-flex', family: "'Google Sans Flex', sans-serif", category: 'Sans-serif' },
  { label: 'Vollkorn', value: 'vollkorn', family: "'Vollkorn', serif", category: 'Serif' },
  { label: 'Source Serif 4', value: 'source-serif-4', family: "'Source Serif 4', serif", category: 'Serif' },
  { label: 'Cascadia Code', value: 'cascadia-code', family: "'Cascadia Code', monospace", category: 'Mono' },
  { label: 'Inconsolata', value: 'inconsolata', family: "'Inconsolata', monospace", category: 'Mono' },
  { label: 'Lexend', value: 'lexend', family: "'Lexend', sans-serif", category: 'Dyslexia-friendly' },
]

const groupedFonts = computed(() => {
  const groups: { category: string, fonts: FontOption[] }[] = []
  for (const opt of fontOptions) {
    const existing = groups.find(g => g.category === opt.category)
    if (existing) {
      existing.fonts.push(opt)
    }
    else {
      groups.push({ category: opt.category, fonts: [opt] })
    }
  }
  return groups
})

const themeOptions: { label: string, value: ColorScheme, icon: string }[] = [
  { label: 'Light', value: 'light', icon: 'i-lucide-sun' },
  { label: 'Dark', value: 'dark', icon: 'i-lucide-moon' },
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
          <p class="text-sm font-medium text-muted mb-3">
            Font
          </p>
          <div class="flex flex-col gap-3">
            <div v-for="group in groupedFonts" :key="group.category">
              <p class="text-xs text-dimmed mb-1.5">
                {{ group.category }}
              </p>
              <div class="flex flex-col gap-0.5">
                <button
                  v-for="opt in group.fonts"
                  :key="opt.value"
                  :aria-label="opt.label"
                  class="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left transition-colors duration-150"
                  :class="font === opt.value
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-elevated text-default'"
                  @click="font = opt.value"
                >
                  <span
                    class="text-base truncate"
                    :style="{ fontFamily: opt.family }"
                  >
                    {{ opt.label }}
                  </span>
                  <UIcon
                    v-if="font === opt.value"
                    name="i-lucide-check"
                    class="ml-auto shrink-0 size-4"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        <USeparator />

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
