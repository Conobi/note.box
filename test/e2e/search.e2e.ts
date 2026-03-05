import { expect, test } from '@nuxt/test-utils/playwright'
import { resetApp, seedNotes } from './helpers'

test.describe('Search', () => {
  test.beforeEach(async ({ page, goto }) => {
    await resetApp(page, goto)
    await seedNotes(page, goto, [
      { id: 's-1', title: 'Grocery List' },
      { id: 's-2', title: 'Meeting Notes' },
      { id: 's-3', title: 'Travel Plans' },
    ])
  })

  test('search filters notes by title', async ({ page }) => {
    await page.locator('aside').hover()
    const searchInput = page.locator('aside input[placeholder="Search notes..."]')
    await searchInput.fill('grocery')

    // Only the matching note should be visible
    await expect(page.locator('aside a[href="/notes/grocery-list"]')).toBeVisible()
    await expect(page.locator('aside a[href="/notes/meeting-notes"]')).not.toBeVisible()
    await expect(page.locator('aside a[href="/notes/travel-plans"]')).not.toBeVisible()
  })

  test('clearing search shows all notes', async ({ page }) => {
    await page.locator('aside').hover()
    const searchInput = page.locator('aside input[placeholder="Search notes..."]')

    await searchInput.fill('grocery')
    await expect(page.locator('aside a[href="/notes/meeting-notes"]')).not.toBeVisible()

    await searchInput.clear()
    await expect(page.locator('aside a[href="/notes/grocery-list"]')).toBeVisible()
    await expect(page.locator('aside a[href="/notes/meeting-notes"]')).toBeVisible()
    await expect(page.locator('aside a[href="/notes/travel-plans"]')).toBeVisible()
  })

  test('no matching notes shows empty message', async ({ page }) => {
    await page.locator('aside').hover()
    const searchInput = page.locator('aside input[placeholder="Search notes..."]')
    await searchInput.fill('xyznonexistent')

    await expect(page.getByText('No matching notes')).toBeVisible()
  })
})
