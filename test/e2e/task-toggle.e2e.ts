import { expect, test } from '@nuxt/test-utils/playwright'
import { resetApp, waitForSave } from './helpers'

test.describe('Task toggle with Ctrl+Space', () => {
  test.beforeEach(async ({ page, goto }) => {
    await resetApp(page, goto)
  })

  /** Seed a note with a task list directly into localStorage. */
  async function seedTaskNote(
    page: Parameters<typeof resetApp>[0],
    goto: Parameters<typeof resetApp>[1],
    tasks: { text: string, checked: boolean }[],
  ) {
    const slug = 'task-toggle-test'
    await page.evaluate(({ slug, tasks }) => {
      const now = new Date().toISOString()
      const note = {
        id: 'tt-1',
        slug,
        title: 'Task Toggle',
        content: {
          type: 'doc',
          content: [
            { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Task Toggle' }] },
            {
              type: 'taskList',
              content: tasks.map(t => ({
                type: 'taskItem',
                attrs: { checked: t.checked },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: t.text }] }],
              })),
            },
          ],
        },
        createdAt: now,
        updatedAt: now,
      }
      localStorage.setItem('note.box:notes', JSON.stringify([note]))
    }, { slug, tasks })

    await goto(`/notes/${slug}`, { waitUntil: 'hydration' })
  }

  /** Select all task items by clicking the first and Shift+Ctrl+End. */
  async function selectAllTasks(page: Parameters<typeof resetApp>[0], firstTaskText: string) {
    const editor = page.locator('.tiptap')
    await editor.getByText(firstTaskText).click()
    await page.keyboard.press('Home')
    await page.keyboard.press('Shift+Control+End')
  }

  test('Ctrl+Space toggles single unchecked task under cursor', async ({ page, goto }) => {
    await seedTaskNote(page, goto, [
      { text: 'First task', checked: false },
      { text: 'Second task', checked: false },
    ])

    const editor = page.locator('.tiptap')
    const checkboxes = editor.locator('ul[data-type="taskList"] input[type="checkbox"]')

    await editor.getByText('First task').click()
    await page.waitForTimeout(50)

    await page.keyboard.press('Control+Space')
    await waitForSave(page)

    // Only first task checked, second unchanged
    await expect(checkboxes.nth(0)).toBeChecked()
    await expect(checkboxes.nth(1)).not.toBeChecked()
  })

  test('Ctrl+Space toggles single checked task back to unchecked', async ({ page, goto }) => {
    await seedTaskNote(page, goto, [
      { text: 'Done task', checked: true },
    ])

    const editor = page.locator('.tiptap')
    const checkbox = editor.locator('ul[data-type="taskList"] input[type="checkbox"]').first()

    await editor.getByText('Done task').click()
    await page.waitForTimeout(50)

    await page.keyboard.press('Control+Space')
    await waitForSave(page)

    await expect(checkbox).not.toBeChecked()
  })

  test('all unchecked → Ctrl+Space checks all', async ({ page, goto }) => {
    await seedTaskNote(page, goto, [
      { text: 'Alpha', checked: false },
      { text: 'Beta', checked: false },
      { text: 'Gamma', checked: false },
    ])

    const checkboxes = page.locator('.tiptap ul[data-type="taskList"] input[type="checkbox"]')

    await selectAllTasks(page, 'Alpha')
    await page.keyboard.press('Control+Space')
    await waitForSave(page)

    await expect(checkboxes.nth(0)).toBeChecked()
    await expect(checkboxes.nth(1)).toBeChecked()
    await expect(checkboxes.nth(2)).toBeChecked()
  })

  test('all checked → Ctrl+Space unchecks all', async ({ page, goto }) => {
    await seedTaskNote(page, goto, [
      { text: 'Alpha', checked: true },
      { text: 'Beta', checked: true },
      { text: 'Gamma', checked: true },
    ])

    const checkboxes = page.locator('.tiptap ul[data-type="taskList"] input[type="checkbox"]')

    await selectAllTasks(page, 'Alpha')
    await page.keyboard.press('Control+Space')
    await waitForSave(page)

    await expect(checkboxes.nth(0)).not.toBeChecked()
    await expect(checkboxes.nth(1)).not.toBeChecked()
    await expect(checkboxes.nth(2)).not.toBeChecked()
  })

  test('mixed checked/unchecked → Ctrl+Space checks all', async ({ page, goto }) => {
    await seedTaskNote(page, goto, [
      { text: 'Alpha', checked: true },
      { text: 'Beta', checked: false },
      { text: 'Gamma', checked: true },
    ])

    const checkboxes = page.locator('.tiptap ul[data-type="taskList"] input[type="checkbox"]')

    await selectAllTasks(page, 'Alpha')
    await page.keyboard.press('Control+Space')
    await waitForSave(page)

    // All should be checked (any-unchecked → check all)
    await expect(checkboxes.nth(0)).toBeChecked()
    await expect(checkboxes.nth(1)).toBeChecked()
    await expect(checkboxes.nth(2)).toBeChecked()

    // Now all are checked → Ctrl+Space unchecks all
    await selectAllTasks(page, 'Alpha')
    await page.keyboard.press('Control+Space')
    await waitForSave(page)

    await expect(checkboxes.nth(0)).not.toBeChecked()
    await expect(checkboxes.nth(1)).not.toBeChecked()
    await expect(checkboxes.nth(2)).not.toBeChecked()
  })

  test('nested: toggling child does not affect parent', async ({ page, goto }) => {
    // Seed a note with nested task items
    const slug = 'task-toggle-nested'
    await page.evaluate(({ slug }) => {
      const now = new Date().toISOString()
      const note = {
        id: 'tt-nested',
        slug,
        title: 'Nested Tasks',
        content: {
          type: 'doc',
          content: [
            { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Nested Tasks' }] },
            {
              type: 'taskList',
              content: [
                {
                  type: 'taskItem',
                  attrs: { checked: false },
                  content: [
                    { type: 'paragraph', content: [{ type: 'text', text: 'Parent task' }] },
                    {
                      type: 'taskList',
                      content: [
                        { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Child task' }] }] },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        createdAt: now,
        updatedAt: now,
      }
      localStorage.setItem('note.box:notes', JSON.stringify([note]))
    }, { slug })

    await goto(`/notes/${slug}`, { waitUntil: 'hydration' })

    const editor = page.locator('.tiptap')
    const checkboxes = editor.locator('ul[data-type="taskList"] input[type="checkbox"]')

    // Click on child task text and toggle
    await editor.getByText('Child task').click()
    await page.waitForTimeout(50)
    await page.keyboard.press('Control+Space')
    await waitForSave(page)

    // Child should be checked, parent should remain unchecked
    await expect(checkboxes.nth(0)).not.toBeChecked()
    await expect(checkboxes.nth(1)).toBeChecked()
  })

  test('nested: toggling parent does not affect child', async ({ page, goto }) => {
    const slug = 'task-toggle-nested2'
    await page.evaluate(({ slug }) => {
      const now = new Date().toISOString()
      const note = {
        id: 'tt-nested2',
        slug,
        title: 'Nested Tasks 2',
        content: {
          type: 'doc',
          content: [
            { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Nested Tasks 2' }] },
            {
              type: 'taskList',
              content: [
                {
                  type: 'taskItem',
                  attrs: { checked: false },
                  content: [
                    { type: 'paragraph', content: [{ type: 'text', text: 'Parent task' }] },
                    {
                      type: 'taskList',
                      content: [
                        { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Child task' }] }] },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        createdAt: now,
        updatedAt: now,
      }
      localStorage.setItem('note.box:notes', JSON.stringify([note]))
    }, { slug })

    await goto(`/notes/${slug}`, { waitUntil: 'hydration' })

    const editor = page.locator('.tiptap')
    const checkboxes = editor.locator('ul[data-type="taskList"] input[type="checkbox"]')

    // Click on parent task text and toggle
    await editor.getByText('Parent task').click()
    await page.waitForTimeout(50)
    await page.keyboard.press('Control+Space')
    await waitForSave(page)

    // Parent should be checked, child should remain unchecked
    await expect(checkboxes.nth(0)).toBeChecked()
    await expect(checkboxes.nth(1)).not.toBeChecked()
  })

  test('Ctrl+Space does nothing outside task items', async ({ page, goto }) => {
    await seedTaskNote(page, goto, [
      { text: 'A task', checked: false },
    ])

    const editor = page.locator('.tiptap')

    // Click on the heading (not a task item)
    await editor.getByText('Task Toggle').first().click()
    await page.waitForTimeout(50)

    await page.keyboard.press('Control+Space')

    const checkbox = editor.locator('ul[data-type="taskList"] input[type="checkbox"]').first()
    await expect(checkbox).not.toBeChecked()
  })
})
