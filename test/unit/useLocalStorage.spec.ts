import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { useLocalStorage, _resetLocalStorage } from '~/composables/useLocalStorage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    _resetLocalStorage()
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns default value when storage is empty', () => {
    const data = useLocalStorage('test-key', 'default')
    expect(data.value).toBe('default')
  })

  it('reads existing value from storage', () => {
    localStorage.setItem('test-key', JSON.stringify('stored'))
    const data = useLocalStorage('test-key', 'default')
    expect(data.value).toBe('stored')
  })

  it('writes changes to storage after debounce', async () => {
    const data = useLocalStorage('test-key', 'initial')
    data.value = 'updated'
    await nextTick()
    expect(localStorage.getItem('test-key')).toBeNull()
    vi.advanceTimersByTime(500)
    expect(JSON.parse(localStorage.getItem('test-key')!)).toBe('updated')
  })

  it('handles complex objects', async () => {
    const data = useLocalStorage('test-key', { count: 0 })
    data.value.count = 42
    await nextTick()
    vi.advanceTimersByTime(500)
    expect(JSON.parse(localStorage.getItem('test-key')!)).toEqual({ count: 42 })
  })

  it('handles corrupt JSON gracefully', () => {
    localStorage.setItem('test-key', 'not-json')
    const data = useLocalStorage('test-key', 'default')
    expect(data.value).toBe('default')
  })

  it('syncs across tabs via storage event', () => {
    const data = useLocalStorage('test-key', 'initial')
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'test-key',
      newValue: JSON.stringify('from-other-tab'),
    }))
    expect(data.value).toBe('from-other-tab')
  })

  it('resets to default when storage event has null value', () => {
    localStorage.setItem('test-key', JSON.stringify('stored'))
    const data = useLocalStorage('test-key', 'default')
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'test-key',
      newValue: null,
    }))
    expect(data.value).toBe('default')
  })

  it('ignores storage events for different keys', () => {
    const data = useLocalStorage('test-key', 'initial')
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'other-key',
      newValue: JSON.stringify('something'),
    }))
    expect(data.value).toBe('initial')
  })

  it('returns the same ref for the same key', () => {
    const a = useLocalStorage('shared-key', 'default')
    const b = useLocalStorage('shared-key', 'default')
    expect(a).toBe(b)
  })

  it('flushes pending write on beforeunload', async () => {
    const data = useLocalStorage('test-key', 'initial')
    data.value = 'updated'
    await nextTick()
    expect(localStorage.getItem('test-key')).toBeNull()
    window.dispatchEvent(new Event('beforeunload'))
    expect(JSON.parse(localStorage.getItem('test-key')!)).toBe('updated')
  })

  it('debounces rapid writes', async () => {
    const data = useLocalStorage('test-key', 'initial')
    data.value = 'first'
    await nextTick()
    vi.advanceTimersByTime(200)
    data.value = 'second'
    await nextTick()
    vi.advanceTimersByTime(200)
    data.value = 'third'
    await nextTick()
    expect(localStorage.getItem('test-key')).toBeNull()
    vi.advanceTimersByTime(500)
    expect(JSON.parse(localStorage.getItem('test-key')!)).toBe('third')
  })
})
