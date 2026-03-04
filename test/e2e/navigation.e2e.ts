import { expect, test } from '@nuxt/test-utils/playwright'
import { resetApp, seedNotes } from './helpers'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page, goto }) => {
    await resetApp(page, goto)
  })

  test('root redirects to a note', async ({ page }) => {
    await expect(page).toHaveURL(/\/notes\//)
  })

  test('navigate between notes via sidebar', async ({ page, goto }) => {
    await seedNotes(page, goto, [
      { id: 'nav-1', title: 'Note Alpha' },
      { id: 'nav-2', title: 'Note Beta' },
    ])

    // Click on the second note in sidebar
    await page.locator('aside').hover()
    await page.locator(`aside a[href="/notes/nav-2"]`).click()
    await expect(page).toHaveURL(/\/notes\/nav-2/)

    // Click back on the first
    await page.locator(`aside a[href="/notes/nav-1"]`).click()
    await expect(page).toHaveURL(/\/notes\/nav-1/)
  })

  test('invalid note ID redirects to root', async ({ page, goto }) => {
    await goto('/notes/nonexistent-id-123', { waitUntil: 'hydration' })

    // Should redirect away from the invalid note
    await expect(page).toHaveURL(/\/notes\//)
    // The editor should render (either empty state or a new note)
    await expect(page.locator('.tiptap')).toBeVisible()
  })
})
