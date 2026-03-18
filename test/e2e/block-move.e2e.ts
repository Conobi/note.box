import { expect, test } from '@nuxt/test-utils/playwright'
import { resetApp, seedNote } from './helpers'

test.describe('Block Move (Alt+Arrow)', () => {
  test.beforeEach(async ({ page, goto }) => {
    await resetApp(page, goto)
  })

  test('code block: Alt+ArrowUp moves line up', async ({ page, goto }) => {
    await seedNote(page, goto, { title: 'Move Test', body: '' })
    const editor = page.locator('.tiptap')

    await editor.locator('p').first().click()
    await page.keyboard.type('```js ')
    await page.keyboard.type('line1')
    await page.keyboard.press('Enter')
    await page.keyboard.type('line2')
    await page.keyboard.press('Enter')
    await page.keyboard.type('line3')

    // Cursor is on line3, move it up
    await page.keyboard.press('Alt+ArrowUp')

    const code = await editor.locator('.code-block-wrapper code').textContent()
    expect(code).toContain('line1\nline3\nline2')
  })

  test('code block: Alt+ArrowDown moves line down', async ({ page, goto }) => {
    await seedNote(page, goto, { title: 'Move Down Test', body: '' })
    const editor = page.locator('.tiptap')

    await editor.locator('p').first().click()
    await page.keyboard.type('```js ')
    await page.keyboard.type('aaa')
    await page.keyboard.press('Enter')
    await page.keyboard.type('bbb')
    await page.keyboard.press('Enter')
    await page.keyboard.type('ccc')

    // Move cursor to line 1 (aaa)
    await page.keyboard.press('Home')
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('Alt+ArrowDown')

    const code = await editor.locator('.code-block-wrapper code').textContent()
    expect(code).toContain('bbb\naaa\nccc')
  })

  test('paragraphs: Alt+ArrowUp moves block up', async ({ page, goto }) => {
    await seedNote(page, goto, { title: 'Para Test', body: '' })
    const editor = page.locator('.tiptap')

    await editor.locator('p').first().click()
    await page.keyboard.type('first')
    await page.keyboard.press('Enter')
    await page.keyboard.type('second')

    // Cursor is in "second", move up
    await page.keyboard.press('Alt+ArrowUp')

    const paragraphs = await editor.locator('p').allTextContents()
    expect(paragraphs[0]).toContain('second')
    expect(paragraphs[1]).toContain('first')
  })

  test('boundary: Alt+ArrowUp on first block is no-op', async ({ page, goto }) => {
    await seedNote(page, goto, { title: 'Bound Test', body: 'only paragraph' })
    const editor = page.locator('.tiptap')

    await editor.locator('p').first().click()
    await page.keyboard.press('Alt+ArrowUp')

    await expect(editor.locator('p').first()).toContainText('only paragraph')
  })
})
