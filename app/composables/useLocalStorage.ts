export function useLocalStorage<T>(key: string, defaultValue: T) {
  const data = ref<T>(read()) as Ref<T>

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

  watch(data, (newValue) => {
    write(newValue)
  }, { deep: true })

  if (import.meta.client) {
    window.addEventListener('storage', (event) => {
      if (event.key === key) {
        data.value = event.newValue ? JSON.parse(event.newValue) as T : defaultValue
      }
    })
  }

  return data
}
