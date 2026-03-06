import { expect, test } from '@nuxt/test-utils/playwright'
import { resetApp, seedNote, seedNotes } from './helpers'

const isMac = process.platform === 'darwin'
const meta = isMac ? 'Meta' : 'Control'

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page, goto }) => {
    await resetApp(page, goto)
  })

  test('Ctrl/Cmd+N creates a new note', async ({ page, goto }) => {
    await seedNote(page, goto)
    const initialUrl = page.url()

    await page.keyboard.press(`${meta}+n`)

    // Should navigate to a different note URL
    await expect(page).toHaveURL(/\/notes\//)
    expect(page.url()).not.toBe(initialUrl)
    await expect(page.locator('.tiptap')).toBeVisible()
  })

  test('Ctrl/Cmd+N creates another note when one already exists', async ({ page, goto }) => {
    await seedNotes(page, goto, [
      { id: 'n-1', title: 'Existing Note' },
    ])

    const countBefore = await page.locator('aside a[href^="/notes/"]').count()
    await page.keyboard.press(`${meta}+n`)
    await expect(page).toHaveURL(/\/notes\//)

    // Sidebar should now have one more note
    await page.locator('aside').hover()
    await expect(page.locator('aside a[href^="/notes/"]')).toHaveCount(countBefore + 1)
  })

  test('Ctrl/Cmd+, opens settings modal', async ({ page, goto }) => {
    await seedNote(page, goto)

    // Settings dialog should not be visible initially
    await expect(page.getByRole('dialog')).not.toBeVisible()

    await page.keyboard.press(`${meta}+,`)

    // Settings modal should appear
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('dialog').getByText('Settings')).toBeVisible()
  })

  test('Ctrl/Cmd+K focuses the search input on desktop', async ({ page, goto }) => {
    await seedNotes(page, goto, [
      { id: 'n-1', title: 'Alpha Note' },
      { id: 'n-2', title: 'Beta Note' },
    ])

    await page.keyboard.press(`${meta}+k`)

    // Search input should be focused — the shortcut also triggers the sidebar reveal
    const searchInput = page.locator('aside input[placeholder="Search notes..."]')
    await expect(searchInput).toBeFocused({ timeout: 2000 })

    // Typing should filter notes
    await page.keyboard.type('Alpha')
    await expect(page.locator('aside a[href="/notes/alpha-note"]')).toBeVisible()
    await expect(page.locator('aside a[href="/notes/beta-note"]')).not.toBeVisible()
  })

  test('shortcuts do not fire when typing in the editor', async ({ page, goto }) => {
    await seedNote(page, goto)

    // Focus the editor and type
    const editor = page.locator('.tiptap')
    await editor.locator('p').first().click()

    const urlBefore = page.url()

    // Type 'n' in the editor - should NOT trigger new note shortcut
    await page.keyboard.type('n')

    // URL should remain the same (no navigation to a new note)
    expect(page.url()).toBe(urlBefore)

    // Settings should not open
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('Ctrl/Cmd+N creates a new note when editor is focused', async ({ page, goto }) => {
    await seedNote(page, goto)

    // Focus the editor
    const editor = page.locator('.tiptap')
    await editor.locator('p').first().click()

    const urlBefore = page.url()
    await page.keyboard.press(`${meta}+n`)

    // Should navigate to a new note
    await expect(page).toHaveURL(/\/notes\//)
    expect(page.url()).not.toBe(urlBefore)
  })

  test('Ctrl/Cmd+, opens settings when editor is focused', async ({ page, goto }) => {
    await seedNote(page, goto)

    // Focus the editor
    const editor = page.locator('.tiptap')
    await editor.locator('p').first().click()

    await expect(page.getByRole('dialog')).not.toBeVisible()
    await page.keyboard.press(`${meta}+,`)

    // Settings modal should appear
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('dialog').getByText('Settings')).toBeVisible()
  })

  test('Ctrl/Cmd+K focuses search when editor is focused', async ({ page, goto }) => {
    await seedNotes(page, goto, [
      { id: 'n-1', title: 'Alpha Note' },
      { id: 'n-2', title: 'Beta Note' },
    ])

    // Focus the editor
    const editor = page.locator('.tiptap')
    await editor.locator('p').first().click()

    await page.keyboard.press(`${meta}+k`)

    // Search input should be focused
    const searchInput = page.locator('aside input[placeholder="Search notes..."]')
    await expect(searchInput).toBeFocused({ timeout: 2000 })
  })

  test('meta shortcuts work even when search input is focused', async ({ page, goto }) => {
    await seedNotes(page, goto, [
      { id: 'n-1', title: 'Some Note' },
    ])

    await page.locator('aside').hover()
    const searchInput = page.locator('aside input[placeholder="Search notes..."]')
    await searchInput.click()
    await searchInput.fill('test')

    // Press Ctrl+N while search is focused - meta shortcuts still work in inputs
    await page.keyboard.press(`${meta}+n`)

    // Should navigate to new note
    await expect(page).toHaveURL(/\/notes\//)
  })
})

test.describe('Tooltips', () => {
  test.beforeEach(async ({ page, goto }) => {
    await resetApp(page, goto)
  })

  test('sidebar new note button shows tooltip on hover', async ({ page, goto }) => {
    await seedNote(page, goto)

    // Tab to the "New note" button (first Tab stop in sidebar)
    await page.keyboard.press('Tab')

    const tooltip = page.locator('[role="tooltip"]', { hasText: 'New note' })
    await expect(tooltip).toBeVisible({ timeout: 3000 })
  })

  test('sidebar settings button shows tooltip on hover', async ({ page, goto }) => {
    await seedNote(page, goto)

    // Tab twice to reach "Settings" button (second Tab stop)
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    const tooltip = page.locator('[role="tooltip"]', { hasText: 'Settings' })
    await expect(tooltip).toBeVisible({ timeout: 3000 })
  })

  test('delete note button shows tooltip on hover', async ({ page, goto }) => {
    await seedNote(page, goto)

    // Tab to reach the delete button
    const deleteButton = page.locator('aside a[href="/notes/test-note"]').locator('..').getByRole('button', { name: 'Delete note' })
    await page.keyboard.press('Tab')
    for (let i = 0; i < 15; i++) {
      if (await deleteButton.evaluate(el => el === document.activeElement)) break
      await page.keyboard.press('Tab')
    }

    const tooltip = page.locator('[role="tooltip"]', { hasText: 'Delete note' })
    await expect(tooltip).toBeVisible({ timeout: 3000 })
  })

  test('search input shows keyboard shortcut hint', async ({ page, goto }) => {
    await seedNote(page, goto)

    // Hover the sidebar to reveal the search input
    await page.locator('aside').hover()

    // The UKbd elements should be visible inside the search input area
    const sidebar = page.locator('aside')
    await expect(sidebar.locator('kbd')).toHaveCount(2) // meta + K
  })

  test('search input hides keyboard hint when typing', async ({ page, goto }) => {
    await seedNotes(page, goto, [
      { id: 'n-1', title: 'Some Note' },
    ])

    await page.locator('aside').hover()

    const searchInput = page.locator('aside input[placeholder="Search notes..."]')
    await searchInput.fill('test')

    // Kbd hints should disappear when there's text in the search
    const sidebar = page.locator('aside')
    await expect(sidebar.locator('kbd')).toHaveCount(0)
  })
})
