export function isMac(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)
}

export function isFirefox(): boolean {
  return typeof navigator !== 'undefined' && /Firefox\//.test(navigator.userAgent)
}

export function isTouchDevice(): boolean {
  return typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0
}
