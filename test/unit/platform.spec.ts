import { describe, it, expect, vi, afterEach } from 'vitest'
import { isTouchDevice } from '~/utils/platform'

describe('isTouchDevice', () => {
  afterEach(() => vi.restoreAllMocks())

  it('returns true when maxTouchPoints > 0', () => {
    vi.spyOn(navigator, 'maxTouchPoints', 'get').mockReturnValue(5)
    expect(isTouchDevice()).toBe(true)
  })

  it('returns false when maxTouchPoints is 0', () => {
    vi.spyOn(navigator, 'maxTouchPoints', 'get').mockReturnValue(0)
    expect(isTouchDevice()).toBe(false)
  })
})
