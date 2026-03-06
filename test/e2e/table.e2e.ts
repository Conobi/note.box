import { expect, test } from '@nuxt/test-utils/playwright'
import { resetApp, waitForSave } from './helpers'

/** Seed a note that already contains a table. */
async function seedNoteWithTable(
  page: import('@playwright/test').Page,
  goto: (url: string, options?: Record<string, unknown>) => Promise<unknown>,
  cols = 3,
  rows = 2,
) {
  const now = new Date().toISOString()

  const headerCells = Array.from({ length: cols }, (_, i) => ({
    type: 'tableHeader',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: `H${i + 1}` }] }],
  }))

  const dataCells = Array.from({ length: cols }, (_, i) => ({
    type: 'tableCell',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: `C${i + 1}` }] }],
  }))

  const tableRows = [
    { type: 'tableRow', content: headerCells },
    ...Array.from({ length: rows }, () => ({ type: 'tableRow', content: dataCells })),
  ]

  await page.evaluate(({ tableRows, now }) => {
    const note = {
      id: 'table-test',
      slug: 'table-test',
      title: 'Table Test',
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Table Test' }] },
          { type: 'table', content: tableRows },
          { type: 'paragraph' },
        ],
      },
      createdAt: now,
      updatedAt: now,
    }
    localStorage.setItem('note.box:notes', JSON.stringify([note]))
  }, { tableRows, now })

  await goto('/notes/table-test', { waitUntil: 'hydration' })
}

test.describe('Table', () => {
  test.beforeEach(async ({ page, goto }) => {
    await resetApp(page, goto)
  })

  test('table does not overflow the editor container', async ({ page, goto }) => {
    // Seed a table with 8 columns to stress-test overflow
    await seedNoteWithTable(page, goto, 8, 2)

    const overflow = await page.evaluate(() => {
      const table = document.querySelector('.tiptap table') as HTMLTableElement
      const container = document.querySelector('.tiptap') as HTMLElement
      if (!table || !container) return { overflows: true, reason: 'elements not found' }
      return {
        overflows: table.scrollWidth > container.clientWidth,
        tableWidth: table.scrollWidth,
        containerWidth: container.clientWidth,
      }
    })

    expect(overflow.overflows).toBe(false)
  })

  test('table with long content does not overflow', async ({ page, goto }) => {
    await seedNoteWithTable(page, goto, 3, 1)

    // Type a very long string into the first cell
    const firstCell = page.locator('.tiptap table td').first()
    await firstCell.click()
    await page.keyboard.press('Home')
    await page.keyboard.type('ThisIsAVeryLongStringWithoutSpacesThatShouldWrapInsideTheCell_'.repeat(3))
    await waitForSave(page)

    const overflow = await page.evaluate(() => {
      const table = document.querySelector('.tiptap table') as HTMLTableElement
      const container = document.querySelector('.tiptap') as HTMLElement
      if (!table || !container) return true
      return table.scrollWidth > container.clientWidth
    })

    expect(overflow).toBe(false)
  })

  test('Tab navigates to next cell', async ({ page, goto }) => {
    await seedNoteWithTable(page, goto, 3, 1)

    // Click into first header cell
    const firstHeader = page.locator('.tiptap table th').first()
    await firstHeader.click()

    // Press Tab to go to next cell
    await page.keyboard.press('Tab')

    // Type in the second cell to verify focus moved
    await page.keyboard.type('focused')
    await expect(page.locator('.tiptap table th').nth(1)).toContainText('focused')
  })

  test('insert table via slash command', async ({ page, goto }) => {
    await page.evaluate(() => {
      const now = new Date().toISOString()
      const note = {
        id: 'slash-table',
        slug: 'slash-table',
        title: 'Slash Table',
        content: {
          type: 'doc',
          content: [
            { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Slash Table' }] },
            { type: 'paragraph' },
          ],
        },
        createdAt: now,
        updatedAt: now,
      }
      localStorage.setItem('note.box:notes', JSON.stringify([note]))
    })
    await goto('/notes/slash-table', { waitUntil: 'hydration' })

    // Click the empty paragraph and type /
    const emptyPara = page.locator('.tiptap p').first()
    await emptyPara.click()
    await page.keyboard.type('/')

    // Wait for suggestion menu and click Table
    const tableOption = page.getByRole('option', { name: 'Table' })
    await expect(tableOption).toBeVisible()
    await tableOption.click()

    // Verify table was inserted
    await expect(page.locator('.tiptap table')).toBeVisible()
    const cells = page.locator('.tiptap table th, .tiptap table td')
    // 3x3 table with header row: 3 th + 6 td = 9 cells
    await expect(cells).toHaveCount(9)
  })
})
