import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { useAppSettings } from '~/composables/useAppSettings'
import { _resetLocalStorage } from '~/composables/useLocalStorage'

describe('useAppSettings', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    _resetLocalStorage()
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns default settings', () => {
    const { font, colorScheme } = useAppSettings()
    expect(font.value).toBe('inter')
    expect(colorScheme.value).toBe('light')
  })

  it('persists font change to localStorage', async () => {
    const { font } = useAppSettings()
    font.value = 'inconsolata'
    await nextTick()
    vi.advanceTimersByTime(500)

    const stored = JSON.parse(localStorage.getItem('note.box:settings')!)
    expect(stored.font).toBe('inconsolata')
  })

  it('persists colorScheme change to localStorage', async () => {
    const { colorScheme } = useAppSettings()
    colorScheme.value = 'dark'
    await nextTick()
    vi.advanceTimersByTime(500)

    const stored = JSON.parse(localStorage.getItem('note.box:settings')!)
    expect(stored.colorScheme).toBe('dark')
  })

  it('reads existing settings from storage', () => {
    localStorage.setItem('note.box:settings', JSON.stringify({ font: 'vollkorn', colorScheme: 'sepia' }))
    const { font, colorScheme } = useAppSettings()
    expect(font.value).toBe('vollkorn')
    expect(colorScheme.value).toBe('sepia')
  })

  it('shares state across multiple callers', async () => {
    const a = useAppSettings()
    const b = useAppSettings()

    a.font.value = 'cascadia-code'
    await nextTick()

    expect(b.font.value).toBe('cascadia-code')
  })

  it('defaults locale to en when not set', () => {
    const { locale } = useAppSettings()
    expect(locale.value).toBe('en')
  })

  it('persists locale change to localStorage', async () => {
    const { locale } = useAppSettings()
    locale.value = 'fr'
    await nextTick()
    vi.advanceTimersByTime(500)

    const stored = JSON.parse(localStorage.getItem('note.box:settings')!)
    expect(stored.locale).toBe('fr')
  })

  it('reads existing locale from storage', () => {
    localStorage.setItem('note.box:settings', JSON.stringify({ font: 'inter', colorScheme: 'light', locale: 'ja' }))
    const { locale } = useAppSettings()
    expect(locale.value).toBe('ja')
  })

  it('falls back to en for old settings without locale', () => {
    localStorage.setItem('note.box:settings', JSON.stringify({ font: 'inter', colorScheme: 'light' }))
    const { locale } = useAppSettings()
    expect(locale.value).toBe('en')
  })
})
