import { expect, test } from '@nuxt/test-utils/playwright'
import { clickEditorText, resetApp, seedNote } from './helpers'

test.describe('Backtick wrap', () => {
  test.beforeEach(async ({ page, goto }) => {
    await resetApp(page, goto)
  })

  test('selecting text and pressing ` wraps it in inline code', async ({ page, goto }) => {
    await seedNote(page, goto, { id: 'bw-1', title: 'Backtick Test', body: 'some code here' })

    const editor = page.locator('.tiptap')
    await clickEditorText(page, editor, 'some code here')

    // Select "code" by double-clicking it
    await editor.getByText('some code here').dblclick()
    // Double-click selects "code" — but depending on browser it might select differently.
    // Let's use keyboard selection instead for precision.

    // Place cursor before "code" and select just that word
    await clickEditorText(page, editor, 'some code here')
    await page.keyboard.press('Home')
    // Move right 5 chars to reach start of "code"
    for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight')
    // Select "code" (4 chars)
    for (let i = 0; i < 4; i++) await page.keyboard.press('Shift+ArrowRight')

    // Press backtick
    await page.keyboard.press('`')

    // The word "code" should now be wrapped in a <code> element
    const codeEl = editor.locator('p code')
    await expect(codeEl).toHaveText('code')
  })

  test('pressing ` again on selected inline code removes it', async ({ page, goto }) => {
    await seedNote(page, goto, { id: 'bw-2', title: 'Backtick Toggle', body: 'remove code mark' })

    const editor = page.locator('.tiptap')
    await clickEditorText(page, editor, 'remove code mark')
    await page.keyboard.press('Home')
    // Move to "code" (position 7)
    for (let i = 0; i < 7; i++) await page.keyboard.press('ArrowRight')
    // Select "code"
    for (let i = 0; i < 4; i++) await page.keyboard.press('Shift+ArrowRight')

    // Apply inline code
    await page.keyboard.press('`')
    await expect(editor.locator('p code')).toHaveText('code')

    // Re-select "code" and press backtick again to remove
    for (let i = 0; i < 4; i++) await page.keyboard.press('Shift+ArrowLeft')
    await page.keyboard.press('`')

    // Code mark should be removed
    await expect(editor.locator('p code')).toHaveCount(0)
    await expect(editor.locator('p')).toContainText('remove code mark')
  })

  test('pressing ` with no selection types a backtick normally', async ({ page, goto }) => {
    await seedNote(page, goto, { id: 'bw-3', title: 'Backtick Normal', body: 'hello' })

    const editor = page.locator('.tiptap')
    await clickEditorText(page, editor, 'hello')
    await page.keyboard.press('End')

    // Type backtick with no selection
    await page.keyboard.press('`')

    await expect(editor.locator('p')).toContainText('hello`')
  })
})
