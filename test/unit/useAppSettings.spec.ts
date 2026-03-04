import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { useAppSettings } from '~/composables/useAppSettings'
import { _resetLocalStorage } from '~/composables/useLocalStorage'

describe('useAppSettings', () => {
  beforeEach(() => {
    _resetLocalStorage()
    localStorage.clear()
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

    const stored = JSON.parse(localStorage.getItem('note.box:settings')!)
    expect(stored.font).toBe('inconsolata')
  })

  it('persists colorScheme change to localStorage', async () => {
    const { colorScheme } = useAppSettings()
    colorScheme.value = 'dark'
    await nextTick()

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
})
