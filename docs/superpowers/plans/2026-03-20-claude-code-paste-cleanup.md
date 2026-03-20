# Claude Code Paste Cleanup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Detect and clean up Claude Code TUI whitespace artifacts on paste, with a toast notification and undo.

**Architecture:** A new TipTap extension (`ClaudeCodePaste`) uses `clipboardTextParser` to intercept pasted text before `MarkdownPaste`. Pure detection/cleanup functions are exported separately for unit testing. A companion `handlePaste` handler triggers the toast after insertion.

**Tech Stack:** TipTap/ProseMirror (Extension, Plugin, Slice), Nuxt UI `useToast`, `@tiptap/markdown` storage manager, Vitest.

**Spec:** `docs/superpowers/specs/2026-03-20-claude-code-paste-cleanup.md`

---

### Task 1: Detection and cleanup pure functions

**Files:**
- Create: `app/extensions/ClaudeCodePaste.ts`
- Test: `test/unit/ClaudeCodePaste.test.ts`

This task implements and tests the two exported pure functions. The TipTap extension shell is created but left minimal — wiring comes in Task 2.

- [ ] **Step 1: Write failing tests for `isClaudeCodeContent`**

Create `test/unit/ClaudeCodePaste.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { isClaudeCodeContent, cleanClaudeCodeContent } from '~/extensions/ClaudeCodePaste'

// Helper: build a Claude Code–style line padded to `width` with 2-space leading indent
function ccLine(content: string, width = 80): string {
  const line = '  ' + content
  return line + ' '.repeat(Math.max(0, width - line.length))
}

describe('isClaudeCodeContent', () => {
  it('detects typical Claude Code output', () => {
    const text = [
      ccLine('Here is some text that was output by Claude Code in the terminal.'),
      ccLine('It has a two-space indent at the start and trailing whitespace.'),
      ccLine('Every single line is padded to the exact same terminal width.'),
      '',
      ccLine('Even after blank lines the pattern continues consistently.'),
    ].join('\n')

    const result = isClaudeCodeContent(text)
    expect(result.detected).toBe(true)
    expect(result.terminalWidth).toBe(80)
  })

  it('rejects normal text without whitespace artifacts', () => {
    const text = 'Hello world\nThis is normal text\nNo trailing spaces here'
    expect(isClaudeCodeContent(text).detected).toBe(false)
  })

  it('rejects text with only trailing spaces but no leading indent', () => {
    const text = [
      'No indent here' + ' '.repeat(60),
      'Still no indent' + ' '.repeat(60),
    ].join('\n')
    expect(isClaudeCodeContent(text).detected).toBe(false)
  })

  it('rejects text with only leading indent but no trailing spaces', () => {
    const text = '  Indented line\n  Another indented line\n  Third line'
    expect(isClaudeCodeContent(text).detected).toBe(false)
  })

  it('rejects very short text (terminal width <= 40)', () => {
    const text = [
      ccLine('Hi', 30),
      ccLine('By', 30),
    ].join('\n')
    expect(isClaudeCodeContent(text).detected).toBe(false)
  })

  it('rejects a single non-empty line (< 2 non-empty lines)', () => {
    const text = ccLine('Only one line here')
    expect(isClaudeCodeContent(text).detected).toBe(false)
  })

  it('ignores empty lines when computing terminal width', () => {
    const text = [
      ccLine('Line one'),
      '',
      '',
      ccLine('Line two'),
      '',
      ccLine('Line three'),
    ].join('\n')

    const result = isClaudeCodeContent(text)
    expect(result.detected).toBe(true)
    expect(result.terminalWidth).toBe(80)
  })
})
```

- [ ] **Step 2: Write failing tests for `cleanClaudeCodeContent`**

Append to the same test file:

```ts
describe('cleanClaudeCodeContent', () => {
  it('strips trailing spaces and 2-space leading indent', () => {
    const text = [
      ccLine('Hello world'),
      ccLine('Second line'),
    ].join('\n')

    const result = cleanClaudeCodeContent(text, 80)
    expect(result).toBe('Hello world\nSecond line')
  })

  it('rejoins hard-wrapped lines', () => {
    // A line that fills the terminal width was hard-wrapped
    const longSentence = 'This is a long sentence that was wrapped by the terminal because it exceeded the'
    // 'the' would be at position 76 + 2 leading = 78, padded to 80 → original length = 80
    const continuation = 'maximum width of the terminal window.'
    const text = [
      ccLine(longSentence),  // original length = 80 (hits terminal width)
      ccLine(continuation),
    ].join('\n')

    const result = cleanClaudeCodeContent(text, 80)
    expect(result).toBe(longSentence + ' ' + continuation)
  })

  it('rejoins three consecutive hard-wrapped lines into one paragraph', () => {
    const part1 = 'A'.repeat(76) // + 2 leading = 78, padded to 80
    const part2 = 'B'.repeat(76)
    const part3 = 'end of paragraph'
    const text = [ccLine(part1), ccLine(part2), ccLine(part3)].join('\n')
    const result = cleanClaudeCodeContent(text, 80)
    expect(result).toBe(part1 + ' ' + part2 + ' ' + part3)
  })

  it('preserves intentional short lines (not hard-wrapped)', () => {
    const text = [
      ccLine('Short line'),
      ccLine('Another short line'),
    ].join('\n')

    const result = cleanClaudeCodeContent(text, 80)
    expect(result).toBe('Short line\nAnother short line')
  })

  it('preserves empty lines as paragraph breaks', () => {
    const text = [
      ccLine('Paragraph one'),
      '',
      ccLine('Paragraph two'),
    ].join('\n')

    const result = cleanClaudeCodeContent(text, 80)
    expect(result).toBe('Paragraph one\n\nParagraph two')
  })

  it('does not join onto markdown structural elements', () => {
    // Even if previous line hits terminal width, don't join onto a heading
    const longLine = 'A'.repeat(76) // + 2 leading = 78, padded to 80
    const text = [
      ccLine(longLine),
      ccLine('# Heading'),
      ccLine('- List item'),
      ccLine('> Blockquote'),
      ccLine('```code fence'),
      ccLine('| table row'),
      ccLine('1. Ordered item'),
    ].join('\n')

    const result = cleanClaudeCodeContent(text, 80)
    const lines = result.split('\n')
    expect(lines[1]).toBe('# Heading')
    expect(lines[2]).toBe('- List item')
    expect(lines[3]).toBe('> Blockquote')
    expect(lines[4]).toBe('```code fence')
    expect(lines[5]).toBe('| table row')
    expect(lines[6]).toBe('1. Ordered item')
  })

  it('does not join onto lines starting with * or + (list markers)', () => {
    const longLine = 'A'.repeat(76)
    const text = [
      ccLine(longLine),
      ccLine('* Star list'),
      ccLine(longLine),
      ccLine('+ Plus list'),
    ].join('\n')

    const result = cleanClaudeCodeContent(text, 80)
    const lines = result.split('\n')
    expect(lines[1]).toBe('* Star list')
    expect(lines[3]).toBe('+ Plus list')
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm vitest run test/unit/ClaudeCodePaste.test.ts`
Expected: FAIL — `isClaudeCodeContent` and `cleanClaudeCodeContent` not found.

- [ ] **Step 4: Implement the pure functions**

Create `app/extensions/ClaudeCodePaste.ts` with the detection and cleanup functions (extension shell is added but the ProseMirror plugin is left as a placeholder returning `[]`):

```ts
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Slice } from '@tiptap/pm/model'

// --- Pure functions (exported for testing) ---

/**
 * Detect Claude Code TUI output by checking for:
 * 1. Consistent terminal-width line lengths (trailing space padding)
 * 2. 2-space leading indent on most lines
 */
export function isClaudeCodeContent(text: string): { detected: boolean, terminalWidth: number } {
  const lines = text.split('\n')
  const nonEmptyLines = lines.filter(l => l.length > 0)

  if (nonEmptyLines.length < 2) return { detected: false, terminalWidth: 0 }

  // Find the most common line length (= terminal width)
  const lengthCounts = new Map<number, number>()
  for (const line of nonEmptyLines) {
    const len = line.length
    lengthCounts.set(len, (lengthCounts.get(len) ?? 0) + 1)
  }

  let terminalWidth = 0
  let maxCount = 0
  for (const [len, count] of lengthCounts) {
    if (count > maxCount) {
      maxCount = count
      terminalWidth = len
    }
  }

  if (terminalWidth <= 40) return { detected: false, terminalWidth: 0 }

  // Check both signals
  let trailingSpaceCount = 0
  let leadingIndentCount = 0
  for (const line of nonEmptyLines) {
    if (/\s{3,}$/.test(line)) trailingSpaceCount++
    if (line.startsWith('  ')) leadingIndentCount++
  }

  const total = nonEmptyLines.length
  const detected = (trailingSpaceCount / total) > 0.5 && (leadingIndentCount / total) > 0.5

  return { detected, terminalWidth }
}

const MARKDOWN_STRUCTURAL_RE = /^(#{1,6}\s|[-*+]\s|>\s|```|\||\d+\.\s)/

/**
 * Clean Claude Code TUI output:
 * 1. Strip trailing spaces
 * 2. Strip 2-space leading indent
 * 3. Rejoin hard-wrapped lines
 */
export function cleanClaudeCodeContent(text: string, terminalWidth: number): string {
  const rawLines = text.split('\n')

  // Step 1 & 2: strip, but track original lengths for wrap detection
  const stripped: string[] = []
  const originalLengths: number[] = []

  for (const raw of rawLines) {
    originalLengths.push(raw.length)
    let line = raw.replace(/\s+$/, '') // strip trailing spaces
    if (line.startsWith('  ')) line = line.slice(2) // strip 2-space indent
    stripped.push(line)
  }

  // Step 3: rejoin hard-wrapped lines
  const result: string[] = []
  let i = 0
  while (i < stripped.length) {
    let current = stripped[i]

    // A line was hard-wrapped if its original length is within 2 of terminalWidth.
    // Check the CURRENT i on each iteration (not a stale captured value).
    while (i + 1 < stripped.length) {
      if (Math.abs(originalLengths[i] - terminalWidth) > 2) break
      if (stripped[i + 1] === '') break
      if (MARKDOWN_STRUCTURAL_RE.test(stripped[i + 1])) break
      i++
      current += ' ' + stripped[i]
    }

    result.push(current)
    i++
  }

  return result.join('\n')
}

// --- TipTap Extension (wired in Task 2) ---

export const ClaudeCodePaste = Extension.create({
  name: 'claudeCodePaste',

  addStorage() {
    return {
      detectedFlag: false,
      rawText: '',
    }
  },

  addProseMirrorPlugins() {
    // Placeholder — wired in Task 2
    return []
  },
})
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm vitest run test/unit/ClaudeCodePaste.test.ts`
Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add app/extensions/ClaudeCodePaste.ts test/unit/ClaudeCodePaste.test.ts
git commit -m "feat: add Claude Code paste detection and cleanup functions

Pure functions isClaudeCodeContent() and cleanClaudeCodeContent()
with unit tests. Extension shell created but not yet wired."
```

---

### Task 2: Wire the TipTap extension (clipboardTextParser + handlePaste + toast)

**Files:**
- Modify: `app/extensions/ClaudeCodePaste.ts` (replace the placeholder `addProseMirrorPlugins`)
- Modify: `app/components/NoteEditor.vue:12,201-229` (add import + register extension)
- Modify: `app/locales/en.json` (add toast translation keys)
- Modify: `app/locales/fr.json`, `es.json`, `de.json`, `pt.json`, `zh.json`, `ja.json`, `ko.json`, `ar.json` (add toast translation keys)

This task wires the detection/cleanup into the paste pipeline and adds the toast with undo.

- [ ] **Step 1: Add i18n keys to all locale files**

Add to `app/locales/en.json` under a new `"paste"` section:

```json
"paste": {
  "claudeCodeDetected": "Claude Code content detected and cleaned up",
  "undo": "Undo"
}
```

Add equivalent translations to all 8 other locale files (`fr`, `es`, `de`, `pt`, `zh`, `ja`, `ko`, `ar`).

- [ ] **Step 2: Implement the ProseMirror plugin in `ClaudeCodePaste`**

Replace the placeholder `addProseMirrorPlugins()` in `app/extensions/ClaudeCodePaste.ts`. The extension needs `useToast` and `useI18n` passed in via `configure()` since TipTap extensions run outside Vue's component context.

Update the extension to accept config options and implement both `clipboardTextParser` and `handlePaste`:

```ts
export interface ClaudeCodePasteOptions {
  showToast: (rawText: string) => void
}

export const ClaudeCodePaste = Extension.create<ClaudeCodePasteOptions>({
  name: 'claudeCodePaste',

  addOptions() {
    return {
      showToast: () => {},
    }
  },

  addStorage() {
    return {
      detectedFlag: false,
      rawText: '',
    }
  },

  addProseMirrorPlugins() {
    const editor = this.editor
    const storage = this.editor.storage.claudeCodePaste
    const { showToast } = this.options

    return [
      new Plugin({
        key: new PluginKey('claudeCodePaste'),
        props: {
          clipboardTextParser: (function (text: string, _$context: unknown, plain: boolean): Slice | null {
            if (plain) return null

            const { detected, terminalWidth } = isClaudeCodeContent(text)
            if (!detected) return null

            const manager = (editor as any).storage.markdown?.manager
            if (!manager) return null

            const cleaned = cleanClaudeCodeContent(text, terminalWidth)

            // Store raw text for undo
            storage.rawText = text
            storage.detectedFlag = true

            try {
              const json = (manager as any).parse(cleaned)
              const doc = editor.state.schema.nodeFromJSON(json)
              return new Slice(doc.content, 0, 0)
            }
            catch {
              storage.detectedFlag = false
              return null
            }
          }) as any,

          handlePaste: (_view, _event) => {
            if (!storage.detectedFlag) return false
            storage.detectedFlag = false

            // Show toast after a microtask so the paste transaction completes first
            const rawText = storage.rawText
            Promise.resolve().then(() => showToast(rawText))

            return false // Don't handle the paste — the Slice from clipboardTextParser is used
          },
        },
      }),
    ]
  },
})
```

- [ ] **Step 3: Register the extension in NoteEditor.vue**

In `app/components/NoteEditor.vue`:

1. Add import at line 12 (alongside other extension imports):
   ```ts
   import { ClaudeCodePaste } from '~/extensions/ClaudeCodePaste'
   ```

2. Capture `useToast` at setup time (before the extensions array) — Vue composables must be called synchronously during `setup()`, not inside async callbacks:

   ```ts
   const toast = useToast()
   ```

   (`useI18n` is already captured at line 235 as `const { t } = useI18n()`)

3. In the `editorExtensions` array (line 201-229), insert `ClaudeCodePaste` between `Markdown` (line 226) and `MarkdownPaste` (line 227). `Markdown` must come first so its storage manager exists. `ClaudeCodePaste` must come before `MarkdownPaste` so its `clipboardTextParser` fires first:

   ```ts
   Markdown,
   ClaudeCodePaste.configure({
     showToast: (rawText: string) => {
       toast.add({
         title: t('paste.claudeCodeDetected'),
         actions: [{
           label: t('paste.undo'),
           onClick: () => {
             const editor = editorRef.value
             if (!editor) return
             editor.commands.undo()
             // Re-insert raw text through the markdown manager (without cleanup)
             const manager = (editor as any).storage.markdown?.manager
             if (manager) {
               try {
                 const json = manager.parse(rawText)
                 const doc = editor.state.schema.nodeFromJSON(json)
                 const slice = new Slice(doc.content, 0, 0)
                 editor.view.dispatch(editor.state.tr.replaceSelection(slice))
               }
               catch {
                 // Fallback: insert as plain text
                 editor.commands.insertContent(rawText)
               }
             }
           },
         }],
       })
     },
   }),
   MarkdownPaste,
   ```

   Note: `toast` and `t` are captured at setup time and closed over. `editorRef` is a reactive ref accessed at click time, which is correct. The undo uses `replaceSelection` with a `Slice` (not `replaceSelectionWith` which takes a `Node`) to insert the parsed content at the current cursor position after undo.

   Add `Slice` import at the top of the `<script setup>`:
   ```ts
   import { Slice } from '@tiptap/pm/model'
   ```

- [ ] **Step 4: Verify the full build compiles**

Run: `pnpm typecheck`
Expected: No type errors.

- [ ] **Step 5: Run all tests to ensure nothing is broken**

Run: `pnpm test`
Expected: All tests PASS (including the unit tests from Task 1).

- [ ] **Step 6: Commit**

```bash
git add app/extensions/ClaudeCodePaste.ts app/components/NoteEditor.vue app/locales/*.json
git commit -m "feat: wire Claude Code paste cleanup extension with toast and undo

ClaudeCodePaste intercepts paste via clipboardTextParser before
MarkdownPaste, detects Claude Code TUI output, cleans it, and
shows a toast with undo action."
```

---

### Task 3: Lint, typecheck, and final verification

**Files:** None new — verification only.

- [ ] **Step 1: Run linter**

Run: `pnpm lint:fix`
Expected: No errors (auto-fixes applied if needed).

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: No type errors.

- [ ] **Step 3: Run all tests**

Run: `pnpm test`
Expected: All tests PASS.

- [ ] **Step 4: Commit any lint fixes**

If lint:fix made changes:
```bash
git add -A
git commit -m "chore: lint fixes for Claude Code paste cleanup"
```
