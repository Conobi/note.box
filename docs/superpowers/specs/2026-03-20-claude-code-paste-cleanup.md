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
2. Find the most common total line length among **non-empty** lines (including trailing spaces). This is the candidate terminal width. Must be >40 to avoid false positives on short text.
3. Check two signals across non-empty lines:
   - **Trailing spaces**: >50% of non-empty lines end with 3+ trailing spaces.
   - **Leading 2-space indent**: >50% of non-empty lines start with exactly 2 spaces.
4. Both conditions must be true to flag as Claude Code content.

## Cleanup: `cleanClaudeCodeContent(text, terminalWidth)`

Returns the cleaned string ready for markdown parsing.

1. Strip trailing spaces from all lines.
2. Strip the 2-space leading indent from lines that have it.
3. Re-join hard-wrapped lines:
   - For each line, track its **original** length (before stripping in steps 1-2).
   - A line was hard-wrapped if its original length is within 2 chars of `terminalWidth` (i.e. the content ran to the edge of the terminal).
   - If a line was hard-wrapped AND the next line is plain continuation text, join them with a space.
   - A line is **not** plain continuation if it:
     - Is empty
     - Starts with a markdown structural marker: `#`, `-`, `*`, `+`, `>`, `` ``` ``, `|`, or a digit followed by `.`
4. Return the cleaned text.

## Extension: `ClaudeCodePaste`

A TipTap `Extension.create()` that adds a ProseMirror plugin.

### Plugin behavior (`clipboardTextParser`)

Uses the `clipboardTextParser` ProseMirror prop (same mechanism as `MarkdownPaste`). In ProseMirror, `clipboardTextParser` fires **before** `handlePaste` — so this extension must use the same prop to intercept the text before `MarkdownPaste` sees it.

1. If `plain` is true (Shift+Paste): return `null` (fall through — respect forced plain-text paste).
2. Run `isClaudeCodeContent(text)`.
3. If not detected: return `null` (fall through to `MarkdownPaste` / default).
4. If detected:
   a. Run `cleanClaudeCodeContent(text, terminalWidth)`.
   b. Store `rawText` in editor storage for the undo mechanism.
   c. Set a `detectedFlag` in editor storage so a companion `handlePaste` handler can show the toast after insertion.
   d. Parse the cleaned text through the `@tiptap/markdown` storage manager (same approach as `MarkdownPaste`).
   e. Build a ProseMirror `Slice` from the parsed doc and return it.

A companion `handlePaste` handler checks the `detectedFlag` and, if set, shows the toast (since `clipboardTextParser` cannot trigger side effects after insertion). It clears the flag and returns `false` (does not handle the paste itself — the `Slice` from `clipboardTextParser` is already used).

### Undo mechanism

On detection, the raw text is stored in editor storage. The toast's **Undo** action calls `editor.commands.undo()` to revert the cleaned insertion, then re-inserts the raw text through the markdown manager (without cleanup) so it still gets markdown parsing. This gives the user the original formatting in case the cleanup heuristic mangled something.

### Extension ordering

`ClaudeCodePaste` must be registered **before** `MarkdownPaste` in the `NoteEditor.vue` extensions array. Since both use `clipboardTextParser`, ProseMirror uses the first plugin's prop that returns a non-null `Slice`. When `ClaudeCodePaste` detects Claude Code content and returns a `Slice`, `MarkdownPaste`'s `clipboardTextParser` is skipped. When not detected, `ClaudeCodePaste` returns `null` and `MarkdownPaste` handles it as usual.

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
