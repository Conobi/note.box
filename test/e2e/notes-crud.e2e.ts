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

  test('new note editor loads after creating while existing note has unsaved content', async ({ page, goto }) => {
    await seedNote(page, goto)

    // Type content into the existing note — this arms a pending debounced save
    const editor = page.locator('.tiptap')
    await editor.locator('p').first().click()
    await page.keyboard.type('some unsaved content')

    // Create a new note BEFORE the debounce fires (flush will run on unmount)
    const addButton = getSidebarAddButton(page)
    await addButton.click({ force: true })

    // The new note's URL must differ from the old one
    await expect(page).not.toHaveURL(/test-note/)
    await expect(page).toHaveURL(/\/notes\//)

    // The editor must be visible — this is the bug: it was not loading
    await expect(page.locator('.tiptap')).toBeVisible()
  })

  test('new note editor shows blank default content, not content from previous note', async ({ page, goto }) => {
    await seedNote(page, goto)

    const addButton = getSidebarAddButton(page)
    await addButton.click({ force: true })

    await expect(page).toHaveURL(/\/notes\//)
    await expect(page.locator('.tiptap')).toBeVisible()

    // New note should not contain the previous note's text
    await expect(page.locator('.tiptap')).not.toContainText('Test Note')
    await expect(page.locator('.tiptap')).not.toContainText('Hello world')
  })

  test('edit a note and auto-save persists content', async ({ page, goto }) => {
    await seedNote(page, goto)

    const editor = page.locator('.tiptap')
    // Click into the paragraph area and type
    await editor.locator('p').first().click()
    await page.keyboard.type(' and more text')

    await waitForSave(page)

    // Reload and verify content persisted
    await goto(`/notes/test-note`, { waitUntil: 'hydration' })
    await expect(editor.locator('p').first()).toContainText('and more text')
  })

  test('delete the active note navigates to next note', async ({ page, goto }) => {
    await seedNotes(page, goto, [
      { id: 'note-a', title: 'First Note' },
      { id: 'note-b', title: 'Second Note' },
    ])

    const deleteBtn = getNoteDeleteButton(page, '/notes/first-note')
    await deleteBtn.click({ force: true })

    // Should navigate to the remaining note
    await expect(page).toHaveURL(/\/notes\/second-note/)
  })

  test('delete the only note redirects to new note', async ({ page, goto }) => {
    await seedNote(page, goto)

    const deleteBtn = getNoteDeleteButton(page, '/notes/test-note')
    await deleteBtn.click({ force: true })

    // A new note should be created automatically (index page creates one)
    await expect(page).toHaveURL(/\/notes\//)
    await expect(page.locator('.tiptap')).toBeVisible()
  })
})
