# Clipboard Copy Interoperability Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve clipboard copy output so content from note.box pastes cleanly into Teams, Google Docs, Word, Confluence, GitHub, and Telegram — with a user setting to choose HTML or Markdown format.

**Architecture:** A new `ClipboardCopy` TipTap extension that patches the `DOMSerializer` for clean HTML and overrides `handleCopy`/`handleCut` to control both `text/html` and `text/plain` clipboard slots using the synchronous `ClipboardEvent.clipboardData.setData()` API. A `copyFormat` setting in `useAppSettings` lets users choose between HTML and Markdown output.

**Tech Stack:** TipTap/ProseMirror (`DOMSerializer`, `Slice`, `Fragment`), ClipboardEvent API, Vitest, Playwright

**Design note — why `jsonContentToMarkdown` over `@tiptap/markdown`:** The editor registers `@tiptap/markdown` for paste parsing (via `MarkdownPaste`), but for copy-out we use the custom `jsonContentToMarkdown()` utility. It operates on `JSONContent` (easy to construct from a `Slice` via `slice.content.toJSON()`), is already well-tested, and avoids coupling the copy path to `@tiptap/markdown`'s serializer internals.

---

### Task 1: Add `CopyFormat` type and setting

**Files:**
- Modify: `app/types/settings.ts`
- Modify: `app/composables/useAppSettings.ts`

- [ ] **Step 1: Add the type and interface field**

In `app/types/settings.ts`, add after the `SupportedLocale` type:

```ts
export type CopyFormat = 'html' | 'markdown'
```

And add to the `AppSettings` interface:

```ts
export interface AppSettings {
  font: WritingFont
  colorScheme: ColorScheme
  locale?: SupportedLocale
  copyFormat?: CopyFormat
}
```

- [ ] **Step 2: Add the computed property in `useAppSettings`**

In `app/composables/useAppSettings.ts`, add the import of `CopyFormat` and a new computed:

```ts
import type { AppSettings, ColorScheme, CopyFormat, SupportedLocale, WritingFont } from '~/types/settings'
```

```ts
const copyFormat = computed<CopyFormat>({
  get: () => settings.value.copyFormat ?? 'html',
  set: (value) => { settings.value = { ...settings.value, copyFormat: value } },
})

return { font, colorScheme, locale, copyFormat }
```

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS (no new errors)

- [ ] **Step 4: Commit**

```bash
git add app/types/settings.ts app/composables/useAppSettings.ts
git commit -m "feat: add CopyFormat type and copyFormat setting"
```

---

### Task 2: Create `ClipboardCopy` extension

**Files:**
- Create: `app/extensions/ClipboardCopy.ts`
- Create: `test/unit/clipboardCopy.spec.ts`
- Reference: `app/extensions/MarkdownPaste.ts` (follow same extension pattern)
- Reference: `app/utils/markdown.ts` (for `jsonContentToMarkdown`)

- [ ] **Step 1: Write the unit tests**

Create `test/unit/clipboardCopy.spec.ts`. Test the exported serializer functions and `escapeHtml` directly — they are pure functions that take a ProseMirror-like node and return `DOMOutputSpec` arrays:

```ts
import { describe, expect, it } from 'vitest'
import {
  serializeCodeBlock,
  serializeTableCell,
  serializeTaskItem,
  serializeTaskList,
  escapeHtml,
} from '~/extensions/ClipboardCopy'
import { jsonContentToMarkdown } from '~/utils/markdown'

// Minimal mock for ProseMirror node shape used by serializers
function mockNode(typeName: string, attrs: Record<string, unknown> = {}, children?: { type: { name: string } }[]) {
  const node = {
    type: { name: typeName },
    attrs,
    forEach: (cb: (child: { type: { name: string } }) => void) => {
      children?.forEach(cb)
    },
  }
  return node as any
}

describe('serializeCodeBlock', () => {
  it('produces <pre><code class="language-X"> with language', () => {
    const node = mockNode('codeBlock', { language: 'javascript' })
    const result = serializeCodeBlock(node)
    expect(result).toEqual(['pre', ['code', { class: 'language-javascript' }, 0]])
  })

  it('produces <pre><code> without class when no language', () => {
    const node = mockNode('codeBlock', { language: '' })
    const result = serializeCodeBlock(node)
    expect(result).toEqual(['pre', ['code', {}, 0]])
  })

  it('produces <pre><code> without class when language is null', () => {
    const node = mockNode('codeBlock', { language: null })
    const result = serializeCodeBlock(node)
    expect(result).toEqual(['pre', ['code', {}, 0]])
  })
})

describe('serializeTableCell', () => {
  it('produces <th> for tableHeader nodes', () => {
    const node = mockNode('tableHeader', {})
    const result = serializeTableCell(node)
    expect(result).toEqual(['th', { style: 'border:1px solid #ccc;padding:6px 12px' }, 0])
  })

  it('produces <td> for tableCell nodes', () => {
    const node = mockNode('tableCell', {})
    const result = serializeTableCell(node)
    expect(result).toEqual(['td', { style: 'border:1px solid #ccc;padding:6px 12px' }, 0])
  })

  it('includes colspan when > 1', () => {
    const node = mockNode('tableHeader', { colspan: 2, rowspan: 1 })
    const result = serializeTableCell(node)
    expect(result).toEqual(['th', { style: 'border:1px solid #ccc;padding:6px 12px', colspan: '2' }, 0])
  })

  it('includes rowspan when > 1', () => {
    const node = mockNode('tableCell', { colspan: 1, rowspan: 3 })
    const result = serializeTableCell(node)
    expect(result).toEqual(['td', { style: 'border:1px solid #ccc;padding:6px 12px', rowspan: '3' }, 0])
  })

  it('includes both colspan and rowspan', () => {
    const node = mockNode('tableCell', { colspan: 2, rowspan: 2 })
    const result = serializeTableCell(node)
    expect(result).toEqual(['td', { style: 'border:1px solid #ccc;padding:6px 12px', colspan: '2', rowspan: '2' }, 0])
  })
})

describe('serializeTaskItem', () => {
  it('produces checked checkbox when checked', () => {
    const node = mockNode('taskItem', { checked: true })
    const result = serializeTaskItem(node)
    expect(result).toEqual(['li', ['input', { type: 'checkbox', checked: '', disabled: '' }], 0])
  })

  it('produces unchecked checkbox when not checked', () => {
    const node = mockNode('taskItem', { checked: false })
    const result = serializeTaskItem(node)
    expect(result).toEqual(['li', ['input', { type: 'checkbox', disabled: '' }], 0])
  })
})

describe('serializeTaskList', () => {
  it('produces ul with no list-style', () => {
    const result = serializeTaskList()
    expect(result).toEqual(['ul', { style: 'list-style:none;padding-left:0' }, 0])
  })
})

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml('<script>"alert"&</script>')).toBe('&lt;script&gt;&quot;alert&quot;&amp;&lt;/script&gt;')
  })

  it('returns empty string unchanged', () => {
    expect(escapeHtml('')).toBe('')
  })
})

describe('sliceToMarkdown (via jsonContentToMarkdown)', () => {
  it('converts a doc fragment with mixed content to Markdown', () => {
    // Simulate what { type: 'doc', content: slice.content.toJSON() } produces
    const json = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Title' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Some text' }] },
        { type: 'codeBlock', attrs: { language: 'ts' }, content: [{ type: 'text', text: 'const x = 1' }] },
      ],
    }
    expect(jsonContentToMarkdown(json)).toBe('## Title\n\nSome text\n\n```ts\nconst x = 1\n```')
  })

  it('handles empty content array', () => {
    expect(jsonContentToMarkdown({ type: 'doc', content: [] })).toBe('')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test -- test/unit/clipboardCopy.spec.ts`
Expected: FAIL (module `~/extensions/ClipboardCopy` not found)

- [ ] **Step 3: Create the extension**

Create `app/extensions/ClipboardCopy.ts`:

```ts
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { DOMSerializer } from '@tiptap/pm/model'
import type { Node as ProseMirrorNode, Schema, DOMOutputSpec } from '@tiptap/pm/model'
import type { Slice } from '@tiptap/pm/model'
import type { EditorView } from '@tiptap/pm/view'
import { jsonContentToMarkdown } from '~/utils/markdown'
import type { CopyFormat } from '~/types/settings'

const CELL_STYLE = 'border:1px solid #ccc;padding:6px 12px'

export function serializeCodeBlock(node: ProseMirrorNode): DOMOutputSpec {
  const lang = node.attrs.language
  const codeAttrs: Record<string, string> = {}
  if (lang) codeAttrs.class = `language-${lang}`
  return ['pre', ['code', codeAttrs, 0]]
}

export function serializeTableCell(node: ProseMirrorNode): DOMOutputSpec {
  const tag = node.type.name === 'tableHeader' ? 'th' : 'td'
  const attrs: Record<string, string> = { style: CELL_STYLE }
  if (node.attrs.colspan && node.attrs.colspan > 1) attrs.colspan = String(node.attrs.colspan)
  if (node.attrs.rowspan && node.attrs.rowspan > 1) attrs.rowspan = String(node.attrs.rowspan)
  return [tag, attrs, 0]
}

function serializeTable(): DOMOutputSpec {
  return ['table', { style: 'border-collapse:collapse' }, 0]
}

function serializeTableRow(): DOMOutputSpec {
  return ['tr', 0]
}

export function serializeTaskItem(node: ProseMirrorNode): DOMOutputSpec {
  const checked = node.attrs.checked
  if (checked) {
    return ['li', ['input', { type: 'checkbox', checked: '', disabled: '' }], 0]
  }
  return ['li', ['input', { type: 'checkbox', disabled: '' }], 0]
}

export function serializeTaskList(): DOMOutputSpec {
  return ['ul', { style: 'list-style:none;padding-left:0' }, 0]
}

export function createClipboardSerializer(schema: Schema): DOMSerializer {
  const base = DOMSerializer.fromSchema(schema)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodes = { ...base.nodes } as Record<string, any>

  if (schema.nodes.codeBlock) nodes.codeBlock = serializeCodeBlock
  if (schema.nodes.table) nodes.table = serializeTable
  if (schema.nodes.tableRow) nodes.tableRow = serializeTableRow
  if (schema.nodes.tableHeader) nodes.tableHeader = serializeTableCell
  if (schema.nodes.tableCell) nodes.tableCell = serializeTableCell
  if (schema.nodes.taskItem) nodes.taskItem = serializeTaskItem
  if (schema.nodes.taskList) nodes.taskList = serializeTaskList

  return new DOMSerializer(nodes, base.marks)
}

function sliceToMarkdown(slice: Slice): string {
  const json = { type: 'doc', content: slice.content.toJSON() }
  return jsonContentToMarkdown(json)
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function serializeSliceToHTML(slice: Slice, serializer: DOMSerializer, view: EditorView): string {
  const fragment = serializer.serializeFragment(slice.content, { document: view.dom.ownerDocument })
  const div = view.dom.ownerDocument.createElement('div')
  div.appendChild(fragment)

  // Post-process: wrap table rows in thead/tbody based on cell node types.
  // DOMSerializer serializes rows individually and can't group them,
  // so we detect header rows by checking for <th> elements and wrap accordingly.
  div.querySelectorAll('table').forEach((table) => {
    const rows = Array.from(table.querySelectorAll(':scope > tr'))
    if (rows.length === 0) return

    const thead = table.ownerDocument.createElement('thead')
    const tbody = table.ownerDocument.createElement('tbody')

    for (const row of rows) {
      if (row.querySelector('th')) {
        thead.appendChild(row)
      }
      else {
        tbody.appendChild(row)
      }
    }

    while (table.firstChild) table.removeChild(table.firstChild)
    if (thead.hasChildNodes()) table.appendChild(thead)
    if (tbody.hasChildNodes()) table.appendChild(tbody)
  })

  return div.innerHTML
}

function handleClipboard(getCopyFormat: () => CopyFormat, serializer: DOMSerializer) {
  return (view: EditorView, event: ClipboardEvent): boolean => {
    const { state } = view
    const { selection } = state
    if (selection.empty) return false

    const slice = selection.content()
    const markdown = sliceToMarkdown(slice)

    if (getCopyFormat() === 'html') {
      const html = serializeSliceToHTML(slice, serializer, view)
      event.clipboardData?.setData('text/html', html)
      event.clipboardData?.setData('text/plain', markdown)
    }
    else {
      event.clipboardData?.setData('text/html', `<pre>${escapeHtml(markdown)}</pre>`)
      event.clipboardData?.setData('text/plain', markdown)
    }

    event.preventDefault()
    return true
  }
}

interface ClipboardCopyOptions {
  getCopyFormat: () => CopyFormat
}

export const ClipboardCopy = Extension.create<ClipboardCopyOptions>({
  name: 'clipboardCopy',

  addOptions() {
    return { getCopyFormat: () => 'html' as CopyFormat }
  },

  addProseMirrorPlugins() {
    const schema = this.editor.schema
    const serializer = createClipboardSerializer(schema)
    const { getCopyFormat } = this.options

    return [
      new Plugin({
        key: new PluginKey('clipboardCopy'),
        props: {
          handleCopy(view, event) {
            return handleClipboard(getCopyFormat, serializer)(view, event as ClipboardEvent)
          },
          handleCut(view, event) {
            const handled = handleClipboard(getCopyFormat, serializer)(view, event as ClipboardEvent)
            if (handled) {
              view.dispatch(view.state.tr.deleteSelection().scrollIntoView())
            }
            return handled
          },
        },
      }),
    ]
  },
})
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test -- test/unit/clipboardCopy.spec.ts`
Expected: PASS

- [ ] **Step 5: Run lint and typecheck**

Run: `pnpm lint:fix && pnpm typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/extensions/ClipboardCopy.ts test/unit/clipboardCopy.spec.ts
git commit -m "feat: add ClipboardCopy extension with patched serializer"
```

---

### Task 3: Wire extension into `NoteEditor.vue`

**Files:**
- Modify: `app/components/NoteEditor.vue`

- [ ] **Step 1: Import and register the extension**

Add import at the top of `<script setup>`:

```ts
import { ClipboardCopy } from '~/extensions/ClipboardCopy'
```

Add `useAppSettings` call and configure the extension:

```ts
const { copyFormat } = useAppSettings()
```

Add to the `editorExtensions` array (after `MarkdownPaste`):

```ts
ClipboardCopy.configure({ getCopyFormat: () => copyFormat.value }),
```

The `getCopyFormat` getter is called at copy-time (not plugin-creation time), so changing the setting takes effect immediately without recreating the editor.

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Run existing tests**

Run: `pnpm test`
Expected: PASS (no regressions)

- [ ] **Step 4: Commit**

```bash
git add app/components/NoteEditor.vue
git commit -m "feat: wire ClipboardCopy extension into NoteEditor"
```

---

### Task 4: Add settings UI

**Files:**
- Modify: `app/components/SettingsModal.vue`
- Modify: all 9 locale files in `app/locales/`

- [ ] **Step 1: Add i18n keys to all locale files**

Add these keys to the `"settings"` section of each locale file:

`app/locales/en.json`:
```json
"copyFormat": "Copy format",
"copyFormatHtml": "HTML",
"copyFormatMarkdown": "Markdown",
"copyFormatDescription": "HTML works best for Docs, Word, Teams. Markdown works best for GitHub, Telegram."
```

Translate for the other 8 locales (`fr`, `es`, `de`, `pt`, `zh`, `ja`, `ko`, `ar`).

- [ ] **Step 2: Add the toggle in `SettingsModal.vue`**

Import `CopyFormat` type and get `copyFormat` from `useAppSettings()`:

```ts
import type { WritingFont, ColorScheme, SupportedLocale, CopyFormat } from '~/types/settings'

const { font, colorScheme, locale: appLocale, copyFormat } = useAppSettings()
```

Add copy format options:

```ts
const copyFormatOptions = computed<{ label: string, value: CopyFormat, icon: string }[]>(() => [
  { label: t('settings.copyFormatHtml'), value: 'html', icon: 'i-lucide-code' },
  { label: t('settings.copyFormatMarkdown'), value: 'markdown', icon: 'i-lucide-hash' },
])
```

Add the UI section in the template, between the Language and Keyboard shortcuts sections (after the Language `</div>` and its `<USeparator />`):

```html
<USeparator />

<!-- Copy format section -->
<div>
  <div class="flex items-center gap-2 mb-4">
    <UIcon name="i-lucide-clipboard-copy" class="size-4 text-muted" />
    <p class="text-sm font-medium text-muted">
      {{ t('settings.copyFormat') }}
    </p>
  </div>
  <div class="grid grid-cols-2 gap-3">
    <button
      v-for="opt in copyFormatOptions"
      :key="opt.value"
      :aria-label="opt.label"
      class="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all duration-150"
      :class="copyFormat === opt.value
        ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
        : 'border-default hover:border-muted hover:bg-elevated'"
      @click="copyFormat = opt.value"
    >
      <UIcon
        :name="opt.icon"
        class="size-4"
        :class="copyFormat === opt.value ? 'text-primary' : 'text-muted'"
      />
      <span
        class="text-sm font-medium"
        :class="copyFormat === opt.value ? 'text-primary' : 'text-default'"
      >
        {{ opt.label }}
      </span>
    </button>
  </div>
  <p class="text-xs text-dimmed mt-2 px-1">
    {{ t('settings.copyFormatDescription') }}
  </p>
</div>
```

The UI follows the same grid pattern as the theme toggle (2-column grid with icon + label).

- [ ] **Step 3: Run lint and typecheck**

Run: `pnpm lint:fix && pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/components/SettingsModal.vue app/locales/
git commit -m "feat: add copy format toggle in settings modal"
```

---

### Task 5: E2E tests

**Files:**
- Create: `test/e2e/clipboard-copy.e2e.ts`
- Modify: `test/e2e/helpers.ts` (add `seedNoteWithContent` helper)
- Reference: `test/e2e/code-display.e2e.ts` (for clipboard permission pattern)

- [ ] **Step 1: Add `seedNoteWithContent` helper**

In `test/e2e/helpers.ts`, add a helper that accepts raw `JSONContent` for tests needing custom content:

```ts
/** Seed a note with custom JSONContent and reload. */
export async function seedNoteWithContent(
  page: Page,
  goto: Goto,
  opts: { id: string, slug: string, title: string, content: Record<string, unknown> },
) {
  const now = new Date().toISOString()
  await page.evaluate(({ id, slug, title, content, now }) => {
    localStorage.clear()
    const note = { id, slug, title, content, createdAt: now, updatedAt: now }
    localStorage.setItem('note.box:notes', JSON.stringify([note]))
  }, { ...opts, now })
  await goto(`/notes/${opts.slug}`, { waitUntil: 'hydration' })
}
```

- [ ] **Step 2: Write E2E tests**

Create `test/e2e/clipboard-copy.e2e.ts`:

```ts
import { expect, test } from '@nuxt/test-utils/playwright'
import { seedNoteWithContent } from './helpers'

/** Read text/html from clipboard via navigator.clipboard.read(). */
async function readClipboardHTML(page: import('@playwright/test').Page): Promise<string> {
  return page.evaluate(async () => {
    const items = await navigator.clipboard.read()
    for (const item of items) {
      if (item.types.includes('text/html')) {
        const blob = await item.getType('text/html')
        return blob.text()
      }
    }
    return ''
  })
}

test.describe('Clipboard copy interoperability', () => {
  test('copies table as clean HTML with thead/tbody', async ({ page, goto, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
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

    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+c')

    const html = await readClipboardHTML(page)
    expect(html).toContain('<thead>')
    expect(html).toContain('<tbody>')
    expect(html).toContain('<th')
    expect(html).toContain('border')

    // Also verify text/plain contains Markdown table
    const text = await page.evaluate(() => navigator.clipboard.readText())
    expect(text).toContain('| Name | Value |')
  })

  test('detects table headers by node type, not row position', async ({ page, goto, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    // Table with body cells in the first row (no header row)
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

    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+c')

    const html = await readClipboardHTML(page)
    // No thead since there are no tableHeader nodes
    expect(html).not.toContain('<thead>')
    // All rows should be in tbody
    expect(html).toContain('<tbody>')
    expect(html).toContain('<td')
    expect(html).not.toContain('<th')
  })

  test('copies code block with language class', async ({ page, goto, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
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

    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+c')

    const html = await readClipboardHTML(page)
    expect(html).toContain('language-javascript')
  })

  test('markdown mode puts Markdown in both clipboard slots', async ({ page, goto, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    // Set copyFormat to markdown before seeding
    await page.evaluate(() => {
      localStorage.setItem('note.box:settings', JSON.stringify({
        font: 'inter', colorScheme: 'light', copyFormat: 'markdown',
      }))
    })
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

    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+c')

    // text/plain should be Markdown
    const text = await page.evaluate(() => navigator.clipboard.readText())
    expect(text).toContain('# MD Copy')
    expect(text).toContain('Hello world')

    // text/html should be wrapped in <pre>, not rich HTML
    const html = await readClipboardHTML(page)
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

    // Copy all content
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

    const editor = page.locator('.tiptap')
    await editor.locator('p').first().click()
    await page.keyboard.press('ControlOrMeta+v')

    // Verify pasted content
    await expect(editor.locator('strong')).toContainText('Bold text')
  })
})
```

- [ ] **Step 2: Run the E2E tests**

Run: `pnpm test:e2e -- test/e2e/clipboard-copy.e2e.ts`
Expected: PASS

- [ ] **Step 3: Run the full test suite**

Run: `pnpm test && pnpm test:e2e`
Expected: PASS (no regressions)

- [ ] **Step 4: Commit**

```bash
git add test/e2e/clipboard-copy.e2e.ts test/e2e/helpers.ts
git commit -m "test: add E2E tests for clipboard copy interoperability"
```

---

### Task 6: Final validation

- [ ] **Step 1: Run full lint, typecheck, and tests**

```bash
pnpm lint:fix && pnpm typecheck && pnpm test && pnpm test:e2e
```

Expected: All PASS

- [ ] **Step 2: Manual smoke test**

1. Open the app (`pnpm dev`)
2. Create a note with a table, code block, task list, headings, bold text
3. Select all, Ctrl+C, paste into:
   - A plain text editor (should see Markdown)
   - Google Docs (should see formatted table with borders)
   - A rich text field like Teams (should see formatted content)
4. Open Settings, switch to "Markdown" format
5. Select all, Ctrl+C, paste into a plain text editor (should see Markdown)
6. Paste into Google Docs (should see preformatted text, not rich formatting)
