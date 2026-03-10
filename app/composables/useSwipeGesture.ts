import type { Ref } from 'vue'

export type SwipeAction =
  | 'open-sidebar'
  | 'close-sidebar'
  | 'open-settings'
  | 'close-settings'
  | null

/**
 * Pure gesture detection — no DOM dependency, trivially unit-testable.
 * Returns the action implied by the gesture, or null if the gesture is
 * not meaningful (diagonal, below threshold, wrong edge, wrong state).
 */
export function detectSwipeAction(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  sidebarOpen: boolean,
  settingsOpen: boolean,
  isRtl: boolean,
  windowWidth: number,
  edgeThreshold = 40,
  swipeDistance = 60,
): SwipeAction {
  const dx = endX - startX
  const dy = endY - startY
  if (Math.abs(dy) >= Math.abs(dx)) return null // diagonal — reject

  if (!isRtl) {
    if (!sidebarOpen && dx > swipeDistance && startX <= edgeThreshold) return 'open-sidebar'
    if (sidebarOpen && dx < -swipeDistance) return 'close-sidebar'
    if (!settingsOpen && dx < -swipeDistance && windowWidth - startX <= edgeThreshold) return 'open-settings'
    if (settingsOpen && dx > swipeDistance) return 'close-settings'
  }
  else {
    const edgeRight = windowWidth - startX
    if (!sidebarOpen && dx < -swipeDistance && edgeRight <= edgeThreshold) return 'open-sidebar'
    if (sidebarOpen && dx > swipeDistance) return 'close-sidebar'
    if (!settingsOpen && dx > swipeDistance && startX <= edgeThreshold) return 'open-settings'
    if (settingsOpen && dx < -swipeDistance) return 'close-settings'
  }
  return null
}

/**
 * Returns true when an in-progress gesture (during touchmove) is clearly
 * horizontal and owned by the app. Used to call preventDefault() early,
 * which prevents the browser's native swipe-back navigation from firing.
 */
export function shouldInterceptSwipe(
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  sidebarOpen: boolean,
  settingsOpen: boolean,
  isRtl: boolean,
  windowWidth: number,
  edgeThreshold = 40,
): boolean {
  const dx = currentX - startX
  const dy = currentY - startY
  if (Math.abs(dx) < 10) return false
  if (Math.abs(dy) >= Math.abs(dx)) return false // diagonal

  if (!isRtl) {
    if (sidebarOpen) return true // block all horizontal swipes while sidebar is open
    if (settingsOpen) return true // block all horizontal swipes while settings is open
    if (!sidebarOpen && dx > 0 && startX <= edgeThreshold) return true
    if (!settingsOpen && dx < 0 && windowWidth - startX <= edgeThreshold) return true
  }
  else {
    if (sidebarOpen) return true
    if (settingsOpen) return true
    if (!sidebarOpen && dx < 0 && windowWidth - startX <= edgeThreshold) return true
    if (!settingsOpen && dx > 0 && startX <= edgeThreshold) return true
  }
  return false
}

/**
 * Composable that wires window-level TouchEvents to sidebar and settings state.
 *
 * Listeners are registered on `window` (not on the layout wrapper element) so
 * that swipe-to-close works even when USlideover's teleported backdrop covers
 * the screen — the backdrop is outside the layout DOM subtree, so element-level
 * listeners would never fire for touches on it.
 *
 * The touchmove listener uses { passive: false } so it can call preventDefault()
 * for app-owned horizontal gestures, preventing the browser's native swipe-back
 * navigation from interfering.
 */
export function useSwipeGesture(
  sidebarOpen: Ref<boolean>,
  settingsOpen: Ref<boolean>,
  isRtl: Ref<boolean>,
) {
  let startX = 0
  let startY = 0

  function onTouchStart(e: TouchEvent) {
    const touch = e.touches[0]
    if (!touch) return
    startX = touch.clientX
    startY = touch.clientY
  }

  function onTouchMove(e: TouchEvent) {
    const touch = e.touches[0]
    if (!touch) return
    if (shouldInterceptSwipe(
      startX, startY,
      touch.clientX, touch.clientY,
      sidebarOpen.value, settingsOpen.value,
      isRtl.value, window.innerWidth,
    )) {
      e.preventDefault()
    }
  }

  function onTouchEnd(e: TouchEvent) {
    const touch = e.changedTouches[0]
    if (!touch) return
    const action = detectSwipeAction(
      startX, startY,
      touch.clientX, touch.clientY,
      sidebarOpen.value, settingsOpen.value,
      isRtl.value, window.innerWidth,
    )
    if (action === 'open-sidebar') sidebarOpen.value = true
    else if (action === 'close-sidebar') sidebarOpen.value = false
    else if (action === 'open-settings') settingsOpen.value = true
    else if (action === 'close-settings') settingsOpen.value = false
  }

  onMounted(() => {
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
  })

  onBeforeUnmount(() => {
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('touchend', onTouchEnd)
  })
}
