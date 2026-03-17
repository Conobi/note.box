// test/e2e/code-display.e2e.ts
import { expect, test } from '@nuxt/test-utils/playwright'
import { resetApp, seedNote } from './helpers'

test.describe('Code Display', () => {
  test.beforeEach(async ({ page, goto }) => {
    await resetApp(page, goto)
  })

  test('triple backtick creates a code block with language', async ({ page, goto }) => {
    await seedNote(page, goto, { title: 'Code Test', body: '' })
    const editor = page.locator('.tiptap')

    // Click the empty paragraph and type triple backtick with language
    await editor.locator('p').first().click()
    await page.keyboard.type('```js ')

    // Should create a code block with "js" in the language label
    await expect(editor.locator('.code-block-wrapper')).toBeVisible()
    await expect(editor.locator('.language-label')).toContainText('js')
  })

  test('Enter-Enter exits code block to new paragraph', async ({ page, goto }) => {
    await seedNote(page, goto, { title: 'Exit Test', body: '' })
    const editor = page.locator('.tiptap')

    await editor.locator('p').first().click()
    await page.keyboard.type('```js ')
    await page.keyboard.type('const x = 1')
    await page.keyboard.press('Enter')
    await page.keyboard.press('Enter')

    // Should now be in a regular paragraph outside the code block
    const paragraphs = editor.locator('p')
    await expect(paragraphs.last()).toBeVisible()
  })

  test('copy button copies code to clipboard', async ({ page, goto, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await seedNote(page, goto, { title: 'Copy Test', body: '' })
    const editor = page.locator('.tiptap')

    await editor.locator('p').first().click()
    await page.keyboard.type('```js ')
    await page.keyboard.type('hello world')

    // Hover over the code block to reveal copy button, then click it
    await editor.locator('.code-block-wrapper').hover()
    await editor.locator('.copy-button').click()

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText).toContain('hello world')
  })

  test('inline code: Enter creates new paragraph without code mark', async ({ page, goto }) => {
    await seedNote(page, goto, { title: 'Inline Test', body: '' })
    const editor = page.locator('.tiptap')

    await editor.locator('p').first().click()
    // Type text, then apply inline code via keyboard shortcut
    await page.keyboard.type('hello')
    await page.keyboard.press('ControlOrMeta+e')
    await page.keyboard.type('code')
    await page.keyboard.press('Enter')
    await page.keyboard.type('normal text')

    // The second paragraph should NOT have a <code> element
    const secondPara = editor.locator('p').nth(1)
    await expect(secondPara).toContainText('normal text')
    const codeInSecondPara = secondPara.locator('code')
    await expect(codeInSecondPara).toHaveCount(0)
  })

  test('language picker: open, search, select updates label', async ({ page, goto }) => {
    await seedNote(page, goto, { title: 'Lang Picker Test', body: '' })
    const editor = page.locator('.tiptap')

    // Create a code block
    await editor.locator('p').first().click()
    await page.keyboard.type('```js ')
    await page.keyboard.type('const x = 1')

    // Click the language label to open the picker
    await editor.locator('.language-label').click()

    // Search for "python"
    const searchInput = page.locator('input[placeholder]').last()
    await searchInput.fill('python')

    // Click the Python option
    await page.getByText('Python').click()

    // Label should now show "py"
    await expect(editor.locator('.language-label')).toContainText('py')
  })

  test('Markdown paste creates code block', async ({ page, goto, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await seedNote(page, goto, { title: 'Paste Test', body: '' })
    const editor = page.locator('.tiptap')

    await editor.locator('p').first().click()

    // Write Markdown to system clipboard, then paste via keyboard
    const markdown = '```python\nprint("hello")\n```'
    await page.evaluate(md => navigator.clipboard.writeText(md), markdown)
    await page.keyboard.press('ControlOrMeta+v')

    // Should have a code block
    await expect(editor.locator('.code-block-wrapper')).toBeVisible({ timeout: 3000 })
  })
})
