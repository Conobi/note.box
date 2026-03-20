# Claude Code Paste Cleanup

**Date:** 2026-03-20
**Status:** Approved

## Problem

Claude Code's TUI (built on Ink) pads every rendered line with trailing spaces to the terminal width and adds a 2-space left margin. When users copy text from Claude Code and paste it into note.box, the content is littered with whitespace artifacts that break formatting. Lines are also hard-wrapped at the terminal width, splitting paragraphs into fragments.

## Goal

Silently detect Claude Code output on paste, clean it up (strip padding, rejoin hard-wrapped lines), feed the cleaned text through the existing markdown parser, and show an informational toast with an undo action. Always active, no toggle — the heuristic is specific enough to avoid false positives.

## Detection: `isClaudeCodeContent(text)`

Operates on the raw pasted string. Returns `{ detected: boolean, terminalWidth: number }`.

1. Split into raw lines.
2. Find the most common total line length (including trailing spaces). This is the candidate terminal width. Must be >40 to avoid false positives on short text.
3. Check two signals across non-empty lines:
   - **Trailing spaces**: >50% of non-empty lines end with 3+ trailing spaces.
   - **Leading 2-space indent**: >50% of non-empty lines start with exactly 2 spaces.
4. Both conditions must be true to flag as Claude Code content.

## Cleanup: `cleanClaudeCodeContent(text, terminalWidth)`

Returns the cleaned string ready for markdown parsing.

1. Strip trailing spaces from all lines.
2. Strip the 2-space leading indent from lines that have it.
3. Re-join hard-wrapped lines:
   - Compute max content width = `terminalWidth - 4` (2 leading + 2 trailing margin chars).
   - For each stripped line: if its length is within 2 chars of `maxContentWidth` AND the next line is plain continuation text, join them with a space.
   - A line is **not** plain continuation if it:
     - Is empty
     - Starts with a markdown structural marker: `#`, `-`, `*`, `+`, `>`, `` ``` ``, `|`, or a digit followed by `.`
4. Return the cleaned text.

## Extension: `ClaudeCodePaste`

A TipTap `Extension.create()` that adds a ProseMirror plugin.

### Plugin behavior (`handlePaste`)

1. Extract plain text from the clipboard event (`event.clipboardData.getData('text/plain')`).
2. Run `isClaudeCodeContent(text)`.
3. If not detected: return `false` (fall through to MarkdownPaste / default).
4. If detected:
   a. Run `cleanClaudeCodeContent(text, terminalWidth)`.
   b. Parse the cleaned text through the `@tiptap/markdown` storage manager (same approach as `MarkdownPaste`).
   c. Build a ProseMirror `Slice` from the parsed doc and insert it via `tr.replaceSelection()`.
   d. Show a toast via Nuxt UI `useToast()`: "Claude Code content detected and cleaned up" with an **Undo** action.
   e. Return `true` (paste handled).

### Undo mechanism

Before inserting the cleaned content, capture the current editor state. The toast's Undo action calls `editor.commands.undo()` to revert the cleaned insertion, then inserts the raw text as-is (via the default paste path or direct insertion).

### Extension ordering

`ClaudeCodePaste` must be registered **before** `MarkdownPaste` in the `NoteEditor.vue` extensions array so its `handlePaste` fires first. (`handlePaste` runs before `clipboardTextParser`, so it naturally takes priority.)

## Files

| File | Action |
|------|--------|
| `app/extensions/ClaudeCodePaste.ts` | Create — extension + exported detection/cleanup functions |
| `app/components/NoteEditor.vue` | Edit — register `ClaudeCodePaste` before `MarkdownPaste` |
| `test/unit/ClaudeCodePaste.test.ts` | Create — unit tests for detection and cleanup |

## Testing

### Unit tests (`test/unit/ClaudeCodePaste.test.ts`)

- `isClaudeCodeContent`: true for text with both trailing-space padding and 2-space leading indent; false for normal text, code-only text, short text.
- `cleanClaudeCodeContent`: strips trailing spaces, strips 2-space indent, rejoins hard-wrapped lines, preserves markdown structure (headings, lists, code fences, tables), preserves intentional short lines, handles empty lines as paragraph breaks.
- Edge cases: mixed indent levels, lines with no trailing spaces, very short pastes (<3 lines).

### Manual testing

Paste real Claude Code terminal output into note.box and verify:
- Content is cleaned and rendered as proper markdown.
- Toast appears with undo action.
- Undo reverts to raw pasted content.
- Normal paste (non-Claude-Code) is unaffected.
