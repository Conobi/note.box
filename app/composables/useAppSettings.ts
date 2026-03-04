import type { AppSettings, ColorScheme, WritingFont } from '~/types/settings'

const STORAGE_KEY = 'note.box:settings'
const DEFAULT_SETTINGS: AppSettings = { font: 'inter', colorScheme: 'light' }

export function useAppSettings() {
  const settings = useLocalStorage<AppSettings>(STORAGE_KEY, DEFAULT_SETTINGS)

  const font = computed<WritingFont>({
    get: () => settings.value.font,
    set: (value) => { settings.value = { ...settings.value, font: value } },
  })

  const colorScheme = computed<ColorScheme>({
    get: () => settings.value.colorScheme,
    set: (value) => { settings.value = { ...settings.value, colorScheme: value } },
  })

  return { font, colorScheme }
}
