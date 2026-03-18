import { expect, test } from '@nuxt/test-utils/playwright'
import type { Page } from '@playwright/test'
import { resetApp, seedNoteWithContent } from './helpers'

/**
 * Install a copy-event interceptor that monkey-patches `clipboardData.setData`
 * in the capture phase, so we can read the data that ProseMirror writes.
 */
async function installCopyCapture(page: Page) {
  await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__capturedClipboard = { html: '', text: '' }
    document.addEventListener('copy', (e: Event) => {
      const ce = e as ClipboardEvent
      if (!ce.clipboardData) return
      const origSetData = ce.clipboardData.setData.bind(ce.clipboardData)
      ce.clipboardData.setData = (type: string, data: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (type === 'text/html') (window as any).__capturedClipboard.html = data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (type === 'text/plain') (window as any).__capturedClipboard.text = data
        return origSetData(type, data)
      }
    }, true)
  })
}

/** Focus the editor, select all content, copy, and return captured clipboard data. */
async function selectAllAndCopy(page: Page): Promise<{ html: string, text: string }> {
  await installCopyCapture(page)
  const editor = page.locator('.tiptap')
  await editor.click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('ControlOrMeta+c')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return page.evaluate(() => (window as any).__capturedClipboard)
}

test.describe('Clipboard copy interoperability', () => {
  test.beforeEach(async ({ page, goto }) => {
    await resetApp(page, goto)
  })

  test('copies table as clean HTML with thead/tbody', async ({ page, goto }) => {
    await seedNoteWithContent(page, goto, {
      id: 'table-copy', slug: 'table-copy', title: 'Table Copy',
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Table Copy' }] },
          {
            type: 'table',
            content: [
              {
                type: 'tableRow',
                content: [
                  { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Name' }] }] },
                  { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Value' }] }] },
                ],
              },
              {
                type: 'tableRow',
                content: [
                  { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Alice' }] }] },
                  { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '30' }] }] },
                ],
              },
            ],
          },
        ],
      },
    })

    const { html, text } = await selectAllAndCopy(page)
    expect(html).toContain('<thead>')
    expect(html).toContain('<tbody>')
    expect(html).toContain('<th')
    expect(html).toContain('border')

    // text/plain should contain Markdown table
    expect(text).toContain('| Name | Value |')
  })

  test('detects table headers by node type, not row position', async ({ page, goto }) => {
    await seedNoteWithContent(page, goto, {
      id: 'no-header', slug: 'no-header', title: 'No Header',
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'No Header' }] },
          {
            type: 'table',
            content: [
              {
                type: 'tableRow',
                content: [
                  { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'A' }] }] },
                  { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'B' }] }] },
                ],
              },
            ],
          },
        ],
      },
    })

    const { html } = await selectAllAndCopy(page)
    expect(html).not.toContain('<thead>')
    expect(html).toContain('<tbody>')
    expect(html).toContain('<td')
    expect(html).not.toContain('<th')
  })

  test('copies code block with language class', async ({ page, goto }) => {
    await seedNoteWithContent(page, goto, {
      id: 'code-copy', slug: 'code-copy', title: 'Code Copy',
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Code Copy' }] },
          { type: 'codeBlock', attrs: { language: 'javascript' }, content: [{ type: 'text', text: 'const x = 1' }] },
        ],
      },
    })

    const { html } = await selectAllAndCopy(page)
    expect(html).toContain('language-javascript')
  })

  test('markdown mode puts Markdown in both clipboard slots', async ({ page, goto }) => {
    await seedNoteWithContent(page, goto, {
      id: 'md-copy', slug: 'md-copy', title: 'MD Copy',
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'MD Copy' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Hello world' }] },
        ],
      },
    })

    // Set copyFormat to markdown after seeding (seedNoteWithContent clears localStorage)
    await page.evaluate(() => {
      localStorage.setItem('note.box:settings', JSON.stringify({
        font: 'inter', colorScheme: 'light', copyFormat: 'markdown',
      }))
    })
    await goto('/notes/md-copy', { waitUntil: 'hydration' })

    const { html, text } = await selectAllAndCopy(page)

    // text/plain should be Markdown
    expect(text).toContain('# MD Copy')
    expect(text).toContain('Hello world')

    // text/html should be wrapped in <pre>, not rich HTML
    expect(html).toContain('<pre>')
    expect(html).not.toContain('<table>')
    expect(html).not.toContain('<strong>')
  })

  test('round-trip: copy and paste back preserves content', async ({ page, goto, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await seedNoteWithContent(page, goto, {
      id: 'roundtrip', slug: 'roundtrip', title: 'Roundtrip',
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Roundtrip' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Bold text', marks: [{ type: 'bold' }] }] },
        ],
      },
    })

    // Focus editor, select all, copy
    const editor = page.locator('.tiptap')
    await editor.click()
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+c')

    // Navigate away and create a new note, then paste
    await page.evaluate(() => {
      const notes = JSON.parse(localStorage.getItem('note.box:notes') || '[]')
      const now = new Date().toISOString()
      notes.push({
        id: 'paste-target', slug: 'paste-target', title: 'Paste Target',
        content: { type: 'doc', content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Paste Target' }] },
          { type: 'paragraph' },
        ] },
        createdAt: now, updatedAt: now,
      })
      localStorage.setItem('note.box:notes', JSON.stringify(notes))
    })
    await goto('/notes/paste-target', { waitUntil: 'hydration' })

    const editor2 = page.locator('.tiptap')
    await editor2.locator('p').first().click()
    await page.keyboard.press('ControlOrMeta+v')

    // Verify pasted content
    await expect(editor2.locator('strong')).toContainText('Bold text')
  })
})
