<script setup lang="ts">
import type { WritingFont, ColorScheme, SupportedLocale } from '~/types/settings'
import type { Note } from '~/types/note'

const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
const { setLocale } = useI18n()
const { font, colorScheme, locale: appLocale } = useAppSettings()
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

const themeOptions = computed<{ label: string, value: ColorScheme, icon: string }[]>(() => [
  { label: t('settings.light'), value: 'light', icon: 'i-lucide-sun' },
  { label: t('settings.dark'), value: 'dark', icon: 'i-lucide-moon' },
])

interface LocaleOption {
  code: SupportedLocale
  name: string
}

const localeOptions: LocaleOption[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'pt', name: 'Português' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'ar', name: 'العربية' },
]

function switchLocale(code: SupportedLocale) {
  appLocale.value = code
  setLocale(code)
}

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
  <UModal
    v-model:open="open"
    :title="t('settings.title')"
    :ui="{
      content: 'max-w-full sm:max-w-lg',
      footer: 'justify-end',
    }"
  >
    <template #body>
      <div class="flex flex-col gap-6">
        <!-- Font section -->
        <div>
          <div class="flex items-center gap-2 mb-4">
            <UIcon name="i-lucide-type" class="size-4 text-muted" />
            <p class="text-sm font-medium text-muted">
              {{ t('settings.font') }}
            </p>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="opt in fontOptions"
              :key="opt.value"
              :aria-label="opt.label"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors duration-150 border"
              :class="font === opt.value
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'border-default hover:bg-elevated text-default'"
              :style="{ fontFamily: opt.family }"
              @click="font = opt.value"
            >
              {{ opt.label }}
              <UIcon
                v-if="font === opt.value"
                name="i-lucide-check"
                class="shrink-0 size-3.5"
              />
            </button>
          </div>
          <p
            class="mt-3 text-sm text-muted px-1"
            :style="{ fontFamily: fontOptions.find(o => o.value === font)?.family }"
          >
            {{ t('settings.fontPreview') }}
          </p>
        </div>

        <USeparator />

        <!-- Theme section -->
        <div>
          <div class="flex items-center gap-2 mb-4">
            <UIcon name="i-lucide-palette" class="size-4 text-muted" />
            <p class="text-sm font-medium text-muted">
              {{ t('settings.theme') }}
            </p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="opt in themeOptions"
              :key="opt.value"
              :aria-label="opt.label"
              class="flex flex-col items-center gap-2.5 px-4 py-4 rounded-xl border transition-all duration-150"
              :class="colorScheme === opt.value
                ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                : 'border-default hover:border-muted hover:bg-elevated'"
              @click="colorScheme = opt.value"
            >
              <!-- Mini preview -->
              <div
                class="w-full h-14 rounded-lg border overflow-hidden flex flex-col"
                :class="opt.value === 'light'
                  ? 'bg-white border-gray-200'
                  : 'bg-gray-900 border-gray-700'"
              >
                <div
                  class="h-3 border-b flex items-center px-1.5 gap-0.5"
                  :class="opt.value === 'light'
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-gray-800 border-gray-700'"
                >
                  <span
                    class="size-1 rounded-full"
                    :class="opt.value === 'light' ? 'bg-gray-300' : 'bg-gray-600'"
                  />
                  <span
                    class="size-1 rounded-full"
                    :class="opt.value === 'light' ? 'bg-gray-300' : 'bg-gray-600'"
                  />
                  <span
                    class="size-1 rounded-full"
                    :class="opt.value === 'light' ? 'bg-gray-300' : 'bg-gray-600'"
                  />
                </div>
                <div class="flex-1 flex items-center justify-center gap-1 px-2">
                  <div class="flex flex-col gap-1 flex-1">
                    <span
                      class="block h-1 rounded-full w-3/4"
                      :class="opt.value === 'light' ? 'bg-gray-300' : 'bg-gray-600'"
                    />
                    <span
                      class="block h-1 rounded-full w-1/2"
                      :class="opt.value === 'light' ? 'bg-gray-200' : 'bg-gray-700'"
                    />
                  </div>
                </div>
              </div>
              <!-- Label row -->
              <div class="flex items-center gap-1.5">
                <UIcon
                  :name="opt.icon"
                  class="size-4"
                  :class="colorScheme === opt.value ? 'text-primary' : 'text-muted'"
                />
                <span
                  class="text-sm font-medium"
                  :class="colorScheme === opt.value ? 'text-primary' : 'text-default'"
                >
                  {{ opt.label }}
                </span>
              </div>
            </button>
          </div>
        </div>

        <USeparator />

        <!-- Language section -->
        <div>
          <div class="flex items-center gap-2 mb-4">
            <UIcon name="i-lucide-globe" class="size-4 text-muted" />
            <p class="text-sm font-medium text-muted">
              {{ t('settings.language') }}
            </p>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="opt in localeOptions"
              :key="opt.code"
              :aria-label="opt.name"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors duration-150 border"
              :class="appLocale === opt.code
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'border-default hover:bg-elevated text-default'"
              @click="switchLocale(opt.code)"
            >
              {{ opt.name }}
              <UIcon
                v-if="appLocale === opt.code"
                name="i-lucide-check"
                class="shrink-0 size-3.5"
              />
            </button>
          </div>
        </div>

        <USeparator />

        <!-- Keyboard shortcuts section -->
        <div>
          <div class="flex items-center gap-2 mb-4">
            <UIcon name="i-lucide-keyboard" class="size-4 text-muted" />
            <p class="text-sm font-medium text-muted">
              {{ t('settings.shortcuts') }}
            </p>
          </div>
          <div class="rounded-lg border border-default bg-elevated/50 divide-y divide-default">
            <div class="flex items-center justify-between px-3 py-2.5">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-plus" class="size-3.5 text-muted" />
                <span class="text-sm text-default">{{ t('settings.shortcutNewNote') }}</span>
              </div>
              <div class="flex items-center gap-1">
                <template v-if="isMac()">
                  <UKbd value="meta" /><UKbd>N</UKbd>
                </template>
                <template v-else>
                  <UKbd value="meta" /><UKbd value="shift" /><UKbd>N</UKbd>
                </template>
              </div>
            </div>
            <div class="flex items-center justify-between px-3 py-2.5">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-search" class="size-3.5 text-muted" />
                <span class="text-sm text-default">{{ t('settings.shortcutSearch') }}</span>
              </div>
              <div class="flex items-center gap-1">
                <UKbd value="meta" /><UKbd>K</UKbd>
              </div>
            </div>
            <div class="flex items-center justify-between px-3 py-2.5">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-settings" class="size-3.5 text-muted" />
                <span class="text-sm text-default">{{ t('settings.shortcutSettings') }}</span>
              </div>
              <div class="flex items-center gap-1">
                <UKbd value="meta" /><UKbd>,</UKbd>
              </div>
            </div>
          </div>
        </div>

        <USeparator />

        <!-- Data section -->
        <div>
          <div class="flex items-center gap-2 mb-4">
            <UIcon name="i-lucide-hard-drive" class="size-4 text-muted" />
            <p class="text-sm font-medium text-muted">
              {{ t('settings.data') }}
            </p>
          </div>
          <UButton
            icon="i-lucide-download"
            :label="t('settings.exportAll')"
            variant="soft"
            color="neutral"
            size="sm"
            block
            :loading="exporting"
            :disabled="!notes.length"
            @click="handleExport"
          />
          <p class="text-xs text-dimmed mt-2 px-1">
            {{ t('settings.exportDescription') }}
          </p>
        </div>
      </div>
    </template>
  </UModal>
</template>
