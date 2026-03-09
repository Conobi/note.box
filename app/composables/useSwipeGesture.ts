import type { Ref } from 'vue'

export type SwipeAction = 'open' | 'close' | null

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
  isOpen: boolean,
  isRtl: boolean,
  windowWidth: number,
  edgeThreshold = 40,
  swipeDistance = 60,
): SwipeAction {
  const dx = endX - startX
  const dy = endY - startY
  if (Math.abs(dy) >= Math.abs(dx)) return null // diagonal — reject

  if (!isRtl) {
    if (dx > swipeDistance && startX <= edgeThreshold && !isOpen) return 'open'
    if (dx < -swipeDistance && isOpen) return 'close'
  }
  else {
    const edgeRight = windowWidth - startX
    if (dx < -swipeDistance && edgeRight <= edgeThreshold && !isOpen) return 'open'
    if (dx > swipeDistance && isOpen) return 'close'
  }
  return null
}

/**
 * Composable that wires window-level TouchEvents to sidebar open/close state.
 *
 * Listeners are registered on `window` (not on the layout wrapper element) so
 * that swipe-to-close works even when USlideover's teleported backdrop covers
 * the screen — the backdrop is outside the layout DOM subtree, so element-level
 * listeners would never fire for touches on it.
 */
export function useSwipeGesture(isOpen: Ref<boolean>, isRtl: Ref<boolean>) {
  let startX = 0
  let startY = 0

  function onTouchStart(e: TouchEvent) {
    const touch = e.touches[0]
    if (!touch) return
    startX = touch.clientX
    startY = touch.clientY
  }

  function onTouchEnd(e: TouchEvent) {
    const touch = e.changedTouches[0]
    if (!touch) return
    const action = detectSwipeAction(
      startX, startY,
      touch.clientX, touch.clientY,
      isOpen.value, isRtl.value,
      window.innerWidth,
    )
    if (action === 'open') isOpen.value = true
    else if (action === 'close') isOpen.value = false
  }

  onMounted(() => {
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
  })

  onBeforeUnmount(() => {
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchend', onTouchEnd)
  })
}
