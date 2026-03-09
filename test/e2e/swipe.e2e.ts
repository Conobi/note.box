import { expect, test } from '@nuxt/test-utils/playwright'
import { getMenuButton, resetApp, seedNote, swipe } from './helpers'

// These tests run exclusively on the mobile-chrome project (Pixel 5, hasTouch: true).
// They verify that the swipe gesture handlers in default.vue correctly open and
// close the sidebar based on touch direction, start position, and angle.

test.describe('Swipe gestures', () => {
  test.beforeEach(async ({ page, goto }) => {
    await resetApp(page, goto)
    await seedNote(page, goto)
  })

  test('swipe right from left edge opens sidebar', async ({ page }) => {
    const { height } = page.viewportSize()!
    const midY = height / 2

    // Sidebar should be closed initially (no dialog visible)
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Swipe right starting from within 40px of the left edge
    await swipe(page, { x: 10, y: midY }, { x: 120, y: midY })

    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('swipe left closes sidebar', async ({ page }) => {
    const { height } = page.viewportSize()!
    const midY = height / 2

    // Open sidebar via menu button first (force: true — button is inside a tooltip wrapper)
    await getMenuButton(page).click({ force: true })
    await expect(page.getByRole('dialog')).toBeVisible()

    // Swipe left to close
    await swipe(page, { x: 250, y: midY }, { x: 120, y: midY })

    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('swipe right from center does not open sidebar', async ({ page }) => {
    const { height } = page.viewportSize()!
    const midY = height / 2

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Start from x=150 which is well beyond the 40px edge threshold
    await swipe(page, { x: 150, y: midY }, { x: 260, y: midY })

    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('diagonal swipe does not open sidebar', async ({ page }) => {
    const { height } = page.viewportSize()!

    await expect(page.getByRole('dialog')).not.toBeVisible()

    // |dy| > |dx|: more vertical than horizontal — should be rejected
    await swipe(page, { x: 10, y: height * 0.3 }, { x: 80, y: height * 0.7 })

    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})
