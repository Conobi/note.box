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

    // Dispatch synthetic Tab and verify cursor position in one evaluate to avoid
    // Chrome/CDP cross-call selection reset between evaluate() and keyboard.type().
    const cursorInSecondHeader = await page.evaluate(() => {
      const editor = document.querySelector('.tiptap') as HTMLElement
      editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', keyCode: 9, which: 9, bubbles: true, cancelable: true }))
      const sel = window.getSelection()
      if (!sel || !sel.rangeCount) return false
      const node = sel.anchorNode
      const cell = (node?.nodeType === 1 ? (node as Element) : (node as Text)?.parentElement)?.closest?.('th, td')
      const headers = document.querySelectorAll('.tiptap table th')
      return cell === headers[1]
    })

    expect(cursorInSecondHeader).toBe(true)
  })

  test('Tab on last cell creates new row', async ({ page, goto }) => {
    await seedNoteWithTable(page, goto, 3, 1)

    // Click into last data cell
    const lastCell = page.locator('.tiptap table td').last()
    await lastCell.click()

    // Count rows before
    await expect(page.locator('.tiptap table tr')).toHaveCount(2) // 1 header + 1 data

    // Tab from last cell should create a new row
    await page.keyboard.press('Tab')

    await expect(page.locator('.tiptap table tr')).toHaveCount(3) // 1 header + 2 data
  })

  test('Mod+Shift+T inserts a new table', async ({ page, goto }) => {
    await page.evaluate(() => {
      const now = new Date().toISOString()
      const note = {
        id: 'shortcut-table',
        slug: 'shortcut-table',
        title: 'Shortcut Table',
        content: {
          type: 'doc',
          content: [
            { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Shortcut Table' }] },
            { type: 'paragraph' },
          ],
        },
        createdAt: now,
        updatedAt: now,
      }
      localStorage.setItem('note.box:notes', JSON.stringify([note]))
    })
    await goto('/notes/shortcut-table', { waitUntil: 'hydration' })

    // Click into paragraph and press Mod+Shift+T
    const emptyPara = page.locator('.tiptap p').first()
    await emptyPara.click()
    await page.keyboard.press('ControlOrMeta+Shift+t')

    // Verify a 3x3 table appeared
    await expect(page.locator('.tiptap table')).toBeVisible()
    const cells = page.locator('.tiptap table th, .tiptap table td')
    await expect(cells).toHaveCount(9)
  })

  test('add column before inserts column to the left', async ({ page, goto }) => {
    await seedNoteWithTable(page, goto, 3, 1)

    // Click into the second header cell (H2)
    const secondHeader = page.locator('.tiptap table th').nth(1)
    await secondHeader.click()

    // Count columns before
    await expect(page.locator('.tiptap table th')).toHaveCount(3)

    // Find and click the "Add column before" toolbar button
    // The table bubble toolbar should appear; click the addColumnBefore button
    const addColBeforeBtn = page.getByRole('button', { name: 'Add column before' })
    await expect(addColBeforeBtn).toBeVisible()
    await addColBeforeBtn.click()

    // Verify 4 columns now
    await expect(page.locator('.tiptap table th')).toHaveCount(4)

    // The second header should still be H2 (new column inserted before it)
    await expect(page.locator('.tiptap table th').nth(2)).toContainText('H2')
  })

  test('add row before inserts row above', async ({ page, goto }) => {
    await seedNoteWithTable(page, goto, 3, 1)

    // Click into a data cell
    const dataCell = page.locator('.tiptap table td').first()
    await dataCell.click()

    // Count rows before: 1 header + 1 data = 2
    await expect(page.locator('.tiptap table tr')).toHaveCount(2)

    // Click the "Add row before" toolbar button
    const addRowBeforeBtn = page.getByRole('button', { name: 'Add row before' })
    await expect(addRowBeforeBtn).toBeVisible()
    await addRowBeforeBtn.click()

    // Verify 3 rows now (1 header + 2 data)
    await expect(page.locator('.tiptap table tr')).toHaveCount(3)
  })

  test('table is resizable', async ({ page, goto }) => {
    await seedNoteWithTable(page, goto, 3, 1)

    // Verify the table is rendered with colgroup (indicates resizable table view)
    const colgroup = page.locator('.tiptap table colgroup')
    await expect(colgroup).toBeAttached()

    // Verify col elements have width styles (set by the resizable TableView)
    const cols = page.locator('.tiptap table colgroup col')
    const count = await cols.count()
    expect(count).toBe(3)
  })

  test('right-click on table cell shows context menu', async ({ page, goto }) => {
    await seedNoteWithTable(page, goto, 3, 1)

    // Right-click on a data cell
    const cell = page.locator('.tiptap table td').first()
    await cell.click({ button: 'right' })

    // Verify context menu items appear
    await expect(page.getByRole('menuitem', { name: 'Add row after' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Delete table' })).toBeVisible()
  })

  test('context menu add row after works', async ({ page, goto }) => {
    await seedNoteWithTable(page, goto, 3, 1)

    await expect(page.locator('.tiptap table tr')).toHaveCount(2)

    // First click into the cell to place the editor cursor there
    const cell = page.locator('.tiptap table td').first()
    await cell.click()

    // Right-click on the same cell to open context menu
    await cell.click({ button: 'right' })

    const addRowItem = page.getByRole('menuitem', { name: 'Add row after' })
    await expect(addRowItem).toBeVisible()
    await addRowItem.click()

    // Verify row was added
    await expect(page.locator('.tiptap table tr')).toHaveCount(3)
  })

  test('right-click outside table shows native context menu', async ({ page, goto }) => {
    await seedNoteWithTable(page, goto, 3, 1)

    // Right-click on the heading (outside table)
    const heading = page.locator('.tiptap h1')
    await heading.click({ button: 'right' })

    // The custom table context menu items should NOT appear
    await expect(page.getByRole('menuitem', { name: 'Add row after' })).not.toBeVisible()
  })

  test('right-click on paragraph below table does not show table context menu', async ({ page, goto }) => {
    await seedNoteWithTable(page, goto, 3, 1)

    // Click inside the table first so editor selection is in a table
    const cell = page.locator('.tiptap table td').first()
    await cell.click()

    // Now right-click on the paragraph below the table
    const paragraph = page.locator('.tiptap > p').first()
    await paragraph.click({ button: 'right' })

    // The custom table context menu items should NOT appear
    await expect(page.getByRole('menuitem', { name: 'Add row after' })).not.toBeVisible()
  })

  test('row gutter click selects entire row', async ({ page, goto }) => {
    await seedNoteWithTable(page, goto, 3, 1)

    // Click near the left edge of the first data cell (left gutter)
    const firstDataCell = page.locator('.tiptap table td').first()
    const box = await firstDataCell.boundingBox()
    if (!box) throw new Error('Cell not found')

    // Click at x=5 (within 12px gutter zone) from cell left edge
    await page.mouse.click(box.x + 5, box.y + box.height / 2)

    // All cells in that row should have .selectedCell class
    const selectedCells = page.locator('.tiptap table td.selectedCell')
    await expect(selectedCells).toHaveCount(3)
  })

  test('column gutter click selects entire column', async ({ page, goto }) => {
    await seedNoteWithTable(page, goto, 3, 1)

    // Click near the top edge of the first header cell (top gutter)
    const firstHeader = page.locator('.tiptap table th').first()
    const box = await firstHeader.boundingBox()
    if (!box) throw new Error('Cell not found')

    // Click at y=5 (within 12px gutter zone) from cell top edge
    await page.mouse.click(box.x + box.width / 2, box.y + 5)

    // All cells in that column should have .selectedCell class (1 header + 1 data = 2)
    const selectedCells = page.locator('.tiptap table .selectedCell')
    await expect(selectedCells).toHaveCount(2)
  })

  test('Delete key removes selected row', async ({ page, goto }) => {
    await seedNoteWithTable(page, goto, 3, 2)

    // Click a data cell first to ensure editor has focus
    const firstDataCell = page.locator('.tiptap table td').first()
    await firstDataCell.click()

    // Select a row via gutter click
    const box = await firstDataCell.boundingBox()
    if (!box) throw new Error('Cell not found')
    await page.mouse.click(box.x + 5, box.y + box.height / 2)

    // Verify row is selected
    await expect(page.locator('.tiptap table td.selectedCell')).toHaveCount(3)

    // Count rows before: 1 header + 2 data = 3
    await expect(page.locator('.tiptap table tr')).toHaveCount(3)

    // Press Delete to remove the selected row
    await page.keyboard.press('Delete')

    // Verify row was removed: 1 header + 1 data = 2
    await expect(page.locator('.tiptap table tr')).toHaveCount(2)
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
