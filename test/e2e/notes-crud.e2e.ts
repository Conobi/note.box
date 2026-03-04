import { expect, test } from '@nuxt/test-utils/playwright'
import { getNoteDeleteButton, getSidebarAddButton, resetApp, seedNote, seedNotes, waitForSave } from './helpers'

test.describe('Notes CRUD', () => {
  test.beforeEach(async ({ page, goto }) => {
    await resetApp(page, goto)
  })

  test('landing page creates a note and redirects to it', async ({ page }) => {
    await expect(page).toHaveURL(/\/notes\//)
    await expect(page.locator('.tiptap')).toBeVisible()
  })

  test('create a new note via sidebar button', async ({ page, goto }) => {
    await seedNote(page, goto)

    const addButton = getSidebarAddButton(page)
    await addButton.click({ force: true })

    // Should navigate to a new note URL (different from the seeded one)
    await expect(page).not.toHaveURL(/test-note-1/)
    await expect(page).toHaveURL(/\/notes\//)
    await expect(page.locator('.tiptap')).toBeVisible()
  })

  test('edit a note and auto-save persists content', async ({ page, goto }) => {
    await seedNote(page, goto)

    const editor = page.locator('.tiptap')
    // Click into the paragraph area and type
    await editor.locator('p').first().click()
    await page.keyboard.type(' and more text')

    await waitForSave(page)

    // Reload and verify content persisted
    await goto(`/notes/test-note-1`, { waitUntil: 'hydration' })
    await expect(editor.locator('p').first()).toContainText('and more text')
  })

  test('delete the active note navigates to next note', async ({ page, goto }) => {
    await seedNotes(page, goto, [
      { id: 'note-a', title: 'First Note' },
      { id: 'note-b', title: 'Second Note' },
    ])

    const deleteBtn = getNoteDeleteButton(page, '/notes/note-a')
    await deleteBtn.click({ force: true })

    // Should navigate to the remaining note
    await expect(page).toHaveURL(/\/notes\/note-b/)
  })

  test('delete the only note redirects to new note', async ({ page, goto }) => {
    await seedNote(page, goto)

    const deleteBtn = getNoteDeleteButton(page, '/notes/test-note-1')
    await deleteBtn.click({ force: true })

    // A new note should be created automatically (index page creates one)
    await expect(page).toHaveURL(/\/notes\//)
    await expect(page.locator('.tiptap')).toBeVisible()
  })
})
