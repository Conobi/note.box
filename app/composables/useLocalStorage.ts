const cache = new Map<string, Ref>()
const writeSchedulers = new Map<string, () => void>()

export function _scheduleWrite(key: string): void {
  writeSchedulers.get(key)?.()
}

export function useLocalStorage<T>(key: string, defaultValue: T): Ref<T> {
  if (cache.has(key)) return cache.get(key) as Ref<T>

  const data = ref<T>(read()) as Ref<T>
  cache.set(key, data)

  function read(): T {
    if (import.meta.server) return defaultValue
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) as T : defaultValue
    }
    catch {
      return defaultValue
    }
  }

  function write(value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    }
    catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.warn(`[useLocalStorage] Storage quota exceeded for key "${key}"`)
      }
    }
  }

  let writeTimeout: ReturnType<typeof setTimeout> | null = null

  function scheduleWrite(): void {
    if (writeTimeout) clearTimeout(writeTimeout)
    writeTimeout = setTimeout(() => {
      writeTimeout = null
      write(data.value)
    }, 500)
  }

  function flushWrite(): void {
    if (writeTimeout) {
      clearTimeout(writeTimeout)
      writeTimeout = null
      write(data.value)
    }
  }

  writeSchedulers.set(key, scheduleWrite)

  watch(data, () => {
    scheduleWrite()
  }, { deep: true })

  if (import.meta.client) {
    window.addEventListener('beforeunload', flushWrite)

    window.addEventListener('storage', (event) => {
      if (event.key === key) {
        data.value = event.newValue ? JSON.parse(event.newValue) as T : defaultValue
      }
    })
  }

  return data
}

export function _resetLocalStorage() {
  cache.clear()
  writeSchedulers.clear()
}
