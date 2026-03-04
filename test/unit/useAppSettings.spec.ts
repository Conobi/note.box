import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { _resetAppSettings, useAppSettings } from '~/composables/useAppSettings'

describe('useAppSettings', () => {
  beforeEach(() => {
    _resetAppSettings()
    localStorage.clear()
  })

  it('returns default settings', () => {
    const { font, colorScheme } = useAppSettings()
    expect(font.value).toBe('serif')
    expect(colorScheme.value).toBe('light')
  })

  it('persists font change to localStorage', async () => {
    const { font } = useAppSettings()
    font.value = 'mono'
    await nextTick()

    const stored = JSON.parse(localStorage.getItem('note.box:settings')!)
    expect(stored.font).toBe('mono')
  })

  it('persists colorScheme change to localStorage', async () => {
    const { colorScheme } = useAppSettings()
    colorScheme.value = 'dark'
    await nextTick()

    const stored = JSON.parse(localStorage.getItem('note.box:settings')!)
    expect(stored.colorScheme).toBe('dark')
  })

  it('reads existing settings from storage', () => {
    localStorage.setItem('note.box:settings', JSON.stringify({ font: 'sans', colorScheme: 'sepia' }))
    const { font, colorScheme } = useAppSettings()
    expect(font.value).toBe('sans')
    expect(colorScheme.value).toBe('sepia')
  })

  it('shares state across multiple callers', async () => {
    const a = useAppSettings()
    const b = useAppSettings()

    a.font.value = 'mono'
    await nextTick()

    expect(b.font.value).toBe('mono')
  })
})
