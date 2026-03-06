import { expect, test } from '@nuxt/test-utils/playwright'
import { clickEditorText, resetApp, seedNote, waitForSave } from './helpers'

test.describe('Task List', () => {
  test.beforeEach(async ({ page, goto }) => {
    await resetApp(page, goto)
  })

  test('insert task list via slash command and toggle checkbox', async ({ page, goto }) => {
    await seedNote(page, goto, { id: 'tl-1', title: 'Task Test', body: 'Some text' })

    const editor = page.locator('.tiptap')

    // Place cursor at end of body paragraph and press Enter for new line
    await clickEditorText(page, editor, 'Some text')
    await page.keyboard.press('End')
    await page.keyboard.press('Enter')

    // Type slash command to insert task list
    await page.keyboard.type('/')
    await page.getByText('Task list').click()

    // Type first task item
    await page.keyboard.type('Buy groceries')
    await waitForSave(page)

    // Verify task list is rendered with a checkbox
    const taskList = editor.locator('ul[data-type="taskList"]')
    await expect(taskList).toBeVisible()

    const checkbox = taskList.locator('input[type="checkbox"]').first()
    await expect(checkbox).toBeVisible()
    await expect(checkbox).not.toBeChecked()

    // Toggle the checkbox
    await checkbox.click()
    await expect(checkbox).toBeChecked()
    await waitForSave(page)

    // Verify checked state persists in localStorage
    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('note.box:notes')
      return raw ? JSON.parse(raw) : null
    })
    const taskItem = stored[0].content.content.find(
      (n: { type: string }) => n.type === 'taskList',
    )
    expect(taskItem).toBeTruthy()
    expect(taskItem.content[0].attrs.checked).toBe(true)
  })

  test('task list persists after page reload', async ({ page, goto }) => {
    // Seed a note with a task list already in content
    const id = 'tl-reload'
    const slug = 'task-reload'
    await page.evaluate(({ id, slug }) => {
      const now = new Date().toISOString()
      const note = {
        id,
        slug,
        title: 'Task Reload',
        content: {
          type: 'doc',
          content: [
            { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Task Reload' }] },
            {
              type: 'taskList',
              content: [
                { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Unchecked task' }] }] },
                { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Checked task' }] }] },
              ],
            },
          ],
        },
        createdAt: now,
        updatedAt: now,
      }
      localStorage.setItem('note.box:notes', JSON.stringify([note]))
    }, { id, slug })

    await goto(`/notes/${slug}`, { waitUntil: 'hydration' })

    const editor = page.locator('.tiptap')
    const taskList = editor.locator('ul[data-type="taskList"]')
    await expect(taskList).toBeVisible()

    const checkboxes = taskList.locator('input[type="checkbox"]')
    await expect(checkboxes).toHaveCount(2)
    await expect(checkboxes.nth(0)).not.toBeChecked()
    await expect(checkboxes.nth(1)).toBeChecked()

    // Reload the page
    await goto(`/notes/${slug}`, { waitUntil: 'hydration' })

    // Verify task list still renders correctly
    await expect(editor.locator('ul[data-type="taskList"]')).toBeVisible()
    const reloadedCheckboxes = editor.locator('ul[data-type="taskList"] input[type="checkbox"]')
    await expect(reloadedCheckboxes).toHaveCount(2)
    await expect(reloadedCheckboxes.nth(0)).not.toBeChecked()
    await expect(reloadedCheckboxes.nth(1)).toBeChecked()
  })

  test('typing "[ ] " creates an unchecked task item', async ({ page, goto }) => {
    await seedNote(page, goto, { id: 'tl-input1', title: 'Input Rule Test', body: 'Some text' })

    const editor = page.locator('.tiptap')
    await clickEditorText(page, editor, 'Some text')
    await page.keyboard.press('End')
    await page.keyboard.press('Enter')

    // Type the shortcut "[ ] " (trailing space triggers the input rule)
    await page.keyboard.type('[ ] ', { delay: 50 })

    const taskList = editor.locator('ul[data-type="taskList"]')
    await expect(taskList).toBeVisible()

    const checkbox = taskList.locator('input[type="checkbox"]').first()
    await expect(checkbox).not.toBeChecked()
  })

  test('typing "[] " creates an unchecked task item', async ({ page, goto }) => {
    await seedNote(page, goto, { id: 'tl-input2', title: 'Input Rule Test 2', body: 'Some text' })

    const editor = page.locator('.tiptap')
    await clickEditorText(page, editor, 'Some text')
    await page.keyboard.press('End')
    await page.keyboard.press('Enter')

    await page.keyboard.type('[] ', { delay: 50 })

    const taskList = editor.locator('ul[data-type="taskList"]')
    await expect(taskList).toBeVisible()

    const checkbox = taskList.locator('input[type="checkbox"]').first()
    await expect(checkbox).not.toBeChecked()
  })

  test('typing "[*] " creates a checked task item', async ({ page, goto }) => {
    await seedNote(page, goto, { id: 'tl-input3', title: 'Input Rule Test 3', body: 'Some text' })

    const editor = page.locator('.tiptap')
    await clickEditorText(page, editor, 'Some text')
    await page.keyboard.press('End')
    await page.keyboard.press('Enter')

    await page.keyboard.type('[*] ', { delay: 50 })

    const taskList = editor.locator('ul[data-type="taskList"]')
    await expect(taskList).toBeVisible()

    const checkbox = taskList.locator('input[type="checkbox"]').first()
    await expect(checkbox).toBeChecked()
  })

  test('typing "[x] " creates a checked task item', async ({ page, goto }) => {
    await seedNote(page, goto, { id: 'tl-input4', title: 'Input Rule Test 4', body: 'Some text' })

    const editor = page.locator('.tiptap')
    await clickEditorText(page, editor, 'Some text')
    await page.keyboard.press('End')
    await page.keyboard.press('Enter')

    await page.keyboard.type('[x] ', { delay: 50 })

    const taskList = editor.locator('ul[data-type="taskList"]')
    await expect(taskList).toBeVisible()

    const checkbox = taskList.locator('input[type="checkbox"]').first()
    await expect(checkbox).toBeChecked()
  })

  test('add multiple task items with Enter key', async ({ page, goto }) => {
    await seedNote(page, goto, { id: 'tl-multi', title: 'Multi Tasks', body: 'Body' })

    const editor = page.locator('.tiptap')

    // Place cursor at end and open slash menu
    await clickEditorText(page, editor, 'Body')
    await page.keyboard.press('End')
    await page.keyboard.press('Enter')
    await page.keyboard.type('/')
    await page.getByText('Task list').click()

    // Type multiple tasks separated by Enter
    await page.keyboard.type('Task one')
    await page.keyboard.press('Enter')
    await page.keyboard.type('Task two')
    await page.keyboard.press('Enter')
    await page.keyboard.type('Task three')
    await waitForSave(page)

    const taskItems = editor.locator('ul[data-type="taskList"] li')
    await expect(taskItems).toHaveCount(3)
  })
})
