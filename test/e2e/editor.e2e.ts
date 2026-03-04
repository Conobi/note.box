import { expect, test } from '@nuxt/test-utils/playwright'
import { resetApp, seedNote, seedNotes, waitForSave } from './helpers'

test.describe('Editor', () => {
  test.beforeEach(async ({ page, goto }) => {
    await resetApp(page, goto)
  })

  test('typing in H1 updates the note title in sidebar', async ({ page, goto }) => {
    await seedNote(page, goto, { id: 'ed-1', title: 'Old Title', body: 'Some body' })

    const editor = page.locator('.tiptap')
    const h1 = editor.locator('h1')

    // Triple-click to select all text in the H1, then type new title
    await h1.click({ clickCount: 3 })
    await page.keyboard.type('My New Title')

    await waitForSave(page)

    // Sidebar should reflect the new title (first match is the title, second is preview)
    await expect(page.locator('aside').getByText('My New Title').first()).toBeVisible()
  })

  test('content persists across navigation between notes', async ({ page, goto }) => {
    await seedNotes(page, goto, [
      { id: 'ed-a', title: 'Note A', body: 'Content A' },
      { id: 'ed-b', title: 'Note B', body: 'Content B' },
    ])

    const editor = page.locator('.tiptap')

    // Edit Note A
    await editor.locator('p').first().click()
    await page.keyboard.press('End')
    await page.keyboard.type(' extra')
    await waitForSave(page)

    // Navigate to Note B
    await page.locator('aside a[href="/notes/ed-b"]').click()
    await expect(editor.locator('h1')).toContainText('Note B')

    // Navigate back to Note A
    await page.locator('aside a[href="/notes/ed-a"]').click()
    await expect(editor.locator('p').first()).toContainText('Content A extra')
  })

  test('content survives full page reload', async ({ page, goto }) => {
    await seedNote(page, goto, { id: 'ed-reload', title: 'Reload Test', body: 'Before reload' })

    const editor = page.locator('.tiptap')
    await editor.locator('p').first().click()
    await page.keyboard.press('End')
    await page.keyboard.type(' after edit')
    await waitForSave(page)

    // Full reload
    await goto('/notes/ed-reload', { waitUntil: 'hydration' })
    await expect(page.locator('.tiptap p').first()).toContainText('Before reload after edit')
  })
})
