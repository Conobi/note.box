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
    await page.locator('aside a[href="/notes/note-b"]').click()
    await expect(editor.locator('h1')).toContainText('Note B')

    // Navigate back to Note A
    await page.locator('aside a[href="/notes/note-a"]').click()
    await expect(editor.locator('p').first()).toContainText('Content A extra')
  })

  test('placeholder appears only on the focused empty paragraph', async ({ page, goto }) => {
    // Seed a note with multiple empty paragraphs to reproduce the duplicated placeholder bug
    const id = 'ed-ph'
    const slug = 'placeholder-test'
    await page.evaluate(({ id, slug }) => {
      const now = new Date().toISOString()
      const note = {
        id,
        slug,
        title: 'Placeholder Test',
        content: {
          type: 'doc',
          content: [
            { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Placeholder Test' }] },
            { type: 'paragraph' },
            { type: 'paragraph' },
            { type: 'paragraph' },
          ],
        },
        createdAt: now,
        updatedAt: now,
      }
      localStorage.setItem('note.box:notes', JSON.stringify([note]))
    }, { id, slug })

    await goto(`/notes/${slug}`, { waitUntil: 'hydration' })

    const tiptap = page.locator('.tiptap')

    // Click on the first empty paragraph to focus it
    const emptyParas = tiptap.locator('p.is-empty')
    await expect(emptyParas).toHaveCount(3)
    await emptyParas.first().click()

    // Wait for TipTap decorations to update after selection change
    await page.waitForTimeout(100)

    // Only the focused empty paragraph should have a non-empty data-placeholder
    const placeholderValues = await tiptap.evaluate((el) => {
      const paras = el.querySelectorAll('p.is-empty')
      return Array.from(paras).map(p => p.getAttribute('data-placeholder') || '')
    })
    const withPlaceholder = placeholderValues.filter((v: string) => v !== '')
    expect(withPlaceholder).toHaveLength(1)
    expect(withPlaceholder[0]).toBe('Write, type \'/\' for commands...')
  })

  test('content survives full page reload', async ({ page, goto }) => {
    await seedNote(page, goto, { id: 'ed-reload', title: 'Reload Test', body: 'Before reload' })

    const editor = page.locator('.tiptap')
    await editor.locator('p').first().click()
    await page.keyboard.press('End')
    await page.keyboard.type(' after edit')
    await waitForSave(page)

    // Full reload
    await goto('/notes/reload-test', { waitUntil: 'hydration' })
    await expect(page.locator('.tiptap p').first()).toContainText('Before reload after edit')
  })
})
