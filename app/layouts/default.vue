<script setup lang="ts">
import type { SupportedLocale } from '~/types/settings'

const { t } = useI18n()
const { setLocale, locale: i18nLocale } = useI18n()
const router = useRouter()
const route = useRoute()
const colorMode = useColorMode()
const { font, colorScheme, locale: appLocale } = useAppSettings()
const { create } = useNotes()
const settingsOpen = ref(false)
const sidebarOpen = ref(false)
const mobileNoteListRef = ref<{ focusSearch: () => void } | null>(null)
const desktopNoteListRef = ref<{ focusSearch: () => void } | null>(null)

const isMobile = () => window.innerWidth < 1024

defineShortcuts({
  meta_n: {
    handler: () => createNote(),
  },
  'meta_,': {
    handler: () => { settingsOpen.value = true },
  },
  meta_k: {
    handler: () => {
      if (isMobile()) {
        sidebarOpen.value = true
        nextTick(() => mobileNoteListRef.value?.focusSearch())
      }
      else {
        desktopNoteListRef.value?.focusSearch()
      }
    },
  },
})

const RTL_LOCALES = new Set(['ar'])
const isRtl = computed(() => RTL_LOCALES.has(appLocale.value))

watch(colorScheme, (scheme) => {
  colorMode.preference = scheme
}, { immediate: true })

watch(() => route.fullPath, () => {
  sidebarOpen.value = false
})

// Sync app locale to i18n
watch(appLocale, (loc) => {
  if (i18nLocale.value !== loc) {
    setLocale(loc)
  }
}, { immediate: true })

// On first load, if no stored locale, adopt browser-detected locale
if (!appLocale.value || appLocale.value === 'en') {
  const detected = i18nLocale.value as SupportedLocale
  if (detected && detected !== appLocale.value) {
    appLocale.value = detected
  }
}

function createNote() {
  const note = create()
  router.push(`/notes/${note.slug}`)
}
</script>

<template>
  <div :class="['min-h-screen bg-default flex flex-col lg:flex-row', `font-${font}`]">
    <!-- Mobile top bar -->
    <header class="lg:hidden flex items-center justify-between px-3 py-2 border-b border-default">
      <UTooltip :text="t('app.openMenu')">
        <UButton
          icon="i-lucide-menu"
          size="sm"
          color="neutral"
          variant="ghost"
          :aria-label="t('app.openMenu')"
          @click="sidebarOpen = true"
        />
      </UTooltip>
      <NuxtLink to="/" class="flex items-center text-highlighted" aria-label="note.box">
        <AppLogo class="h-7" />
      </NuxtLink>
      <div class="flex items-center gap-0.5">
        <UTooltip :text="t('app.newNote')" :kbds="['meta', 'N']">
          <UButton
            icon="i-lucide-plus"
            size="sm"
            color="neutral"
            variant="ghost"
            :aria-label="t('app.newNote')"
            @click="createNote"
          />
        </UTooltip>
        <UTooltip :text="t('app.settings')" :kbds="['meta', ',']">
          <UButton
            icon="i-lucide-settings"
            size="sm"
            color="neutral"
            variant="ghost"
            :aria-label="t('app.settings')"
            @click="settingsOpen = true"
          />
        </UTooltip>
      </div>
    </header>

    <!-- Mobile slideover -->
    <USlideover v-model:open="sidebarOpen" :side="isRtl ? 'right' : 'left'" :title="t('noteList.notes')">
      <template #body>
        <NoteList ref="mobileNoteListRef" always-expanded />
      </template>
    </USlideover>

    <!-- Desktop persistent sidebar -->
    <aside class="hidden lg:flex group/sidebar w-55 shrink-0 flex-col bg-default border-r border-transparent hover:border-default transition-[border-color] duration-300">
      <div class="p-3 flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center text-dimmed group-hover/sidebar:text-highlighted transition-colors duration-300" aria-label="note.box">
          <AppLogo class="h-7" />
        </NuxtLink>
        <div class="flex items-center gap-0.5 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
          <UTooltip :text="t('app.newNote')" :kbds="['meta', 'N']">
            <UButton
              icon="i-lucide-plus"
              size="sm"
              color="neutral"
              variant="ghost"
              :aria-label="t('app.newNote')"
              @click="createNote"
            />
          </UTooltip>
          <UTooltip :text="t('app.settings')" :kbds="['meta', ',']">
            <UButton
              icon="i-lucide-settings"
              size="sm"
              color="neutral"
              variant="ghost"
              :aria-label="t('app.settings')"
              @click="settingsOpen = true"
            />
          </UTooltip>
        </div>
      </div>
      <NoteList ref="desktopNoteListRef" />
    </aside>

    <SettingsModal v-model:open="settingsOpen" />

    <!-- Main content -->
    <main class="flex-1 min-w-0 max-w-3xl mx-auto px-4 pb-10">
      <slot />
    </main>
  </div>
</template>
