# Clipboard Copy Interoperability

**Date:** 2026-03-18
**Status:** Approved

## Problem

When copying content from note.box, the clipboard output uses ProseMirror's default HTML serialization, which produces broken or lossy results for:

- **Tables** — no `<thead>`/`<tbody>`/`<th>`, no inline styles. Google Docs, Word, and Teams fail to recognize the table structure.
- **Code blocks** — no `language-*` class on `<code>`. Apps that support syntax highlighting (GitHub, Confluence, Slack) can't detect the language.
- **Task lists** — custom `data-*` attributes mean nothing to external apps. Checkbox state is invisible.

Additionally, there is no way for users to choose whether copied content is formatted as rich HTML or Markdown.

## Scope

- **In scope:** Copy-out (Ctrl+C / Ctrl+X) improvements only
- **Out of scope:** Paste-in behavior (current `MarkdownPaste` extension + TipTap defaults are sufficient)

## Target Apps

Ordered by priority:
1. Microsoft Teams (rich HTML)
2. Google Docs (rich HTML)
3. Microsoft Word (rich HTML)
4. Jira/Confluence (rich HTML)
5. Telegram (plain text / Markdown)
6. GitHub (Markdown-native)

## Design

### Approach: `clipboardSerializer` + `handleCopy`/`handleCut`

A single new TipTap extension — `ClipboardCopy` — that hooks into ProseMirror's copy pipeline.

#### `clipboardSerializer`

Patches the schema's default `DOMSerializer` by overriding only the broken node serializers. All other nodes (headings, paragraphs, lists, blockquotes, marks, etc.) use ProseMirror's defaults unchanged.

Created via:
```ts
const base = DOMSerializer.fromSchema(schema)
const patchedNodes = { ...base.nodes }
// Override only broken nodes
return new DOMSerializer(patchedNodes, base.marks)
```

The patched serializer produces clean, semantic HTML used by `handleCopy` when serializing the copied fragment to `text/html`.

#### `handleCopy` / `handleCut` (both modes)

`handleCopy` and `handleCut` are used in **both** modes (HTML and Markdown) to gain full control over both clipboard MIME types. They use the synchronous `ClipboardEvent.clipboardData.setData()` API, which is universally supported and requires no permissions.

```ts
handleCopy(view, event) {
  const markdown = sliceToMarkdown(slice)
  if (copyFormat === 'html') {
    const html = serializeSliceToHTML(slice, patchedSerializer)
    event.clipboardData?.setData('text/html', html)
    event.clipboardData?.setData('text/plain', markdown)
  } else {
    event.clipboardData?.setData('text/html', `<pre>${escapeHtml(markdown)}</pre>`)
    event.clipboardData?.setData('text/plain', markdown)
  }
  event.preventDefault()
  return true
}
```

**Slice-to-Markdown conversion:** `handleCopy`/`handleCut` receives a ProseMirror `Slice`, not `JSONContent`. Convert via:
```ts
function sliceToMarkdown(slice: Slice): string {
  const json = { type: 'doc', content: slice.content.toJSON() }
  return jsonContentToMarkdown(json)
}
```

#### Extension configuration

The extension reads `copyFormat` from a reactive ref passed as an extension option, configured in `NoteEditor.vue`:

```ts
ClipboardCopy.configure({ copyFormat: settings.value.copyFormat })
```

Inside the extension:
```ts
addOptions() {
  return { copyFormat: 'html' as CopyFormat }
}
```

The option is read inside plugin props via `this.options.copyFormat`.

### Node Override Specifications

#### Code Blocks

```html
<pre><code class="language-javascript">console.log("hello")</code></pre>
```

- `class="language-X"` uses the standard convention recognized by GitHub, Confluence, Slack, VS Code.
- If no language is set, emit `<pre><code>` with no class (no empty `class="language-"`).

#### Tables

```html
<table style="border-collapse:collapse">
  <thead>
    <tr>
      <th style="border:1px solid #ccc;padding:6px 12px">Name</th>
      <th style="border:1px solid #ccc;padding:6px 12px">Age</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #ccc;padding:6px 12px">Alice</td>
      <td style="border:1px solid #ccc;padding:6px 12px">30</td>
    </tr>
  </tbody>
</table>
```

- Semantic `<thead>`/`<tbody>`/`<th>` structure.
- Inline `border` and `padding` styles — necessary because Docs, Word, and Teams strip CSS classes.
- **Header detection by node type:** Rows containing `tableHeader` nodes are wrapped in `<thead>` (with `<th>` elements). Rows containing `tableCell` nodes are wrapped in `<tbody>` (with `<td>` elements). Detection is based on ProseMirror node types, not row position.
- **Merged cells:** Preserve `colspan` and `rowspan` attributes from ProseMirror node attrs when present.

#### Task Lists

```html
<ul style="list-style:none;padding-left:0">
  <li><input type="checkbox" checked disabled> Buy milk</li>
  <li><input type="checkbox" disabled> Walk the dog</li>
</ul>
```

- Standard HTML checkboxes with `disabled` attribute (non-interactive in target apps).
- `checked` attribute reflects task state.
- Teams and Word render the checkbox. GitHub converts to `- [x]` / `- [ ]`.

### Copy Format Setting

New type in `app/types/settings.ts`:

```ts
export type CopyFormat = 'html' | 'markdown'
```

New field in `AppSettings`:

```ts
copyFormat: CopyFormat  // default: 'html'
```

Clipboard content per mode:

| Clipboard slot | `html` mode | `markdown` mode |
|---|---|---|
| `text/html` | Clean semantic HTML (via patched DOMSerializer) | Markdown wrapped in `<pre>` |
| `text/plain` | Markdown via `jsonContentToMarkdown` | Markdown via `jsonContentToMarkdown` |

The `text/plain` slot always contains Markdown regardless of mode, using the existing `jsonContentToMarkdown()` utility.

### Settings UI

A select in `SettingsModal.vue`:
- Label: "Copy format" (i18n key)
- Options: "HTML" / "Markdown"
- Description: "HTML works best for Docs, Word, Teams. Markdown works best for GitHub, Telegram."

### Files

| File | Action |
|------|--------|
| `app/extensions/ClipboardCopy.ts` | New — the extension |
| `app/types/settings.ts` | Modify — add `CopyFormat` type and `copyFormat` field |
| `app/composables/useAppSettings.ts` | Modify — add default value |
| `app/components/SettingsModal.vue` | Modify — add toggle UI |
| `app/components/NoteEditor.vue` | Modify — register extension, pass `copyFormat` option |
| `i18n/` locale files | Modify — add i18n keys |

## Testing

### Unit Tests (`test/unit/clipboardCopy.spec.ts`)

- Code block with language produces `<pre><code class="language-X">`
- Code block without language produces `<pre><code>` (no empty class)
- Table produces `<thead>`/`<tbody>`/`<th>` with inline styles
- Table with merged cells preserves `colspan`/`rowspan`
- Table header detection based on node type (not row position)
- Task list produces `<input type="checkbox">` with correct checked state
- `sliceToMarkdown` correctly converts a Slice to Markdown

### E2E Tests (`test/e2e/clipboard-copy.e2e.ts`)

E2E tests use Playwright with `context.grantPermissions(['clipboard-read', 'clipboard-write'])` to access clipboard contents, and `page.evaluate(() => navigator.clipboard.read())` to read back clipboard data for assertions.

- Copy a table, verify `text/html` has proper structure
- Copy a code block, verify `language-*` class in HTML
- Toggle setting to Markdown, copy content, verify `text/plain` is valid Markdown
- Round-trip: copy from note.box, paste into a new note, verify content preserved
