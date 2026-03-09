import { describe, expect, it } from 'vitest'
import { detectSwipeAction } from '~/composables/useSwipeGesture'

// Viewport width of a typical phone
const W = 390
const MID_Y = 400

describe('detectSwipeAction', () => {
  describe('LTR layout', () => {
    it('swipe right from left edge opens sidebar when closed', () => {
      expect(detectSwipeAction(10, MID_Y, 80, MID_Y, false, false, W)).toBe('open')
    })

    it('does not open when swipe starts away from left edge', () => {
      // startX = 50 > edgeThreshold (40) → should not open
      expect(detectSwipeAction(50, MID_Y, 120, MID_Y, false, false, W)).toBeNull()
    })

    it('does not open when sidebar is already open', () => {
      expect(detectSwipeAction(10, MID_Y, 80, MID_Y, true, false, W)).toBeNull()
    })

    it('swipe left closes sidebar when open', () => {
      expect(detectSwipeAction(200, MID_Y, 120, MID_Y, true, false, W)).toBe('close')
    })

    it('does not close when sidebar is already closed', () => {
      expect(detectSwipeAction(200, MID_Y, 120, MID_Y, false, false, W)).toBeNull()
    })

    it('returns null when swipe distance is below threshold', () => {
      // dx = 30, below swipeDistance (60)
      expect(detectSwipeAction(10, MID_Y, 40, MID_Y, false, false, W)).toBeNull()
    })

    it('returns null for a diagonal swipe (|dy| >= |dx|)', () => {
      // dx = 70, dy = 80 → |dy| > |dx|
      expect(detectSwipeAction(10, 400, 80, 320, false, false, W)).toBeNull()
    })

    it('returns null for a perfectly vertical swipe', () => {
      expect(detectSwipeAction(10, 400, 10, 300, false, false, W)).toBeNull()
    })

    it('handles custom edge threshold', () => {
      // startX = 20, custom edgeThreshold = 10 → outside threshold → null
      expect(detectSwipeAction(20, MID_Y, 100, MID_Y, false, false, W, 10)).toBeNull()
      // startX = 5, custom edgeThreshold = 10 → within threshold → open
      expect(detectSwipeAction(5, MID_Y, 100, MID_Y, false, false, W, 10)).toBe('open')
    })

    it('handles custom swipe distance', () => {
      // dx = 50, default swipeDistance = 60 → null; custom = 40 → open
      expect(detectSwipeAction(10, MID_Y, 60, MID_Y, false, false, W, 40, 40)).toBe('open')
    })
  })

  describe('RTL layout', () => {
    it('swipe left from right edge opens sidebar when closed', () => {
      // startX = 380 → edgeRight = 390-380 = 10 (within 40px threshold)
      // dx = 280-380 = -100 (below -60 threshold)
      expect(detectSwipeAction(380, MID_Y, 280, MID_Y, false, true, W)).toBe('open')
    })

    it('does not open when swipe starts away from right edge', () => {
      // startX = 200 → edgeRight = 190 → outside threshold
      expect(detectSwipeAction(200, MID_Y, 100, MID_Y, false, true, W)).toBeNull()
    })

    it('does not open when sidebar is already open (RTL)', () => {
      expect(detectSwipeAction(380, MID_Y, 280, MID_Y, true, true, W)).toBeNull()
    })

    it('swipe right closes sidebar when open (RTL)', () => {
      expect(detectSwipeAction(100, MID_Y, 200, MID_Y, true, true, W)).toBe('close')
    })

    it('diagonal swipe is rejected in RTL too', () => {
      // dx = -100, dy = -100 → |dy| >= |dx|
      expect(detectSwipeAction(380, 400, 280, 300, false, true, W)).toBeNull()
    })
  })
})
