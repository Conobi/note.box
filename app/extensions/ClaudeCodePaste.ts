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

  // Terminal width = longest line (the line that filled the terminal edge).
  // More robust than mode — works even with 2 lines of different lengths.
  const terminalWidth = Math.max(...nonEmptyLines.map(l => l.length))

  if (terminalWidth <= 60) return { detected: false, terminalWidth: 0 }

  // Check leading 2-space indent (Claude Code's left margin).
  // Must be exactly 2 spaces — not deeper indentation (3+).
  let leadingIndentCount = 0
  for (const line of nonEmptyLines) {
    if (line.startsWith('  ') && !line.startsWith('   ')) leadingIndentCount++
  }

  const total = nonEmptyLines.length
  const detected = (leadingIndentCount / total) > 0.5

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

  // Step 1 & 2: strip padding, but track trimmed lengths for wrap detection.
  // A line was truly hard-wrapped only if its content (without trailing spaces)
  // filled the terminal width. We can't use the raw length because Claude Code
  // pads ALL lines to terminal width.
  const stripped: string[] = []
  const trimmedLengths: number[] = []

  for (const raw of rawLines) {
    trimmedLengths.push(raw.trimEnd().length)
    let line = raw.replace(/\s+$/, '') // strip trailing spaces
    if (line.startsWith('  ')) line = line.slice(2) // strip 2-space indent
    stripped.push(line)
  }

  const result: string[] = []
  let i = 0
  while (i < stripped.length) {
    let current = stripped[i]!

    // Don't join forward from a structural markdown element
    const currentIsStructural = MARKDOWN_STRUCTURAL_RE.test(current)

    // A line was hard-wrapped if its trimmed length is within 2 of terminalWidth.
    // Check the CURRENT i on each iteration (not a stale captured value).
    while (!currentIsStructural && i + 1 < stripped.length) {
      if (Math.abs(trimmedLengths[i]! - terminalWidth) > 2) break
      if (stripped[i + 1]! === '') break
      if (MARKDOWN_STRUCTURAL_RE.test(stripped[i + 1]!)) break
      i++
      current += ' ' + stripped[i]!
    }

    result.push(current)
    i++
  }

  return result.join('\n')
}

// --- TipTap Extension ---

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

  addProseMirrorPlugins() {
    const editor = this.editor
    const { showToast } = this.options

    return [
      new Plugin({
        key: new PluginKey('claudeCodePaste'),
        props: {
          // handlePaste fires regardless of clipboard content type (HTML or plain text).
          // clipboardTextParser is skipped when HTML is on the clipboard (which terminals do),
          // so we must intercept at handlePaste level.
          handlePaste: (view, event) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((view as any).input?.shiftKey) return false // Shift+paste = force plain text, skip

            const text = event.clipboardData?.getData('text/plain')
            if (!text) return false

            const { detected, terminalWidth } = isClaudeCodeContent(text)
            if (!detected) return false

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const manager = (editor as any).storage.markdown?.manager
            if (!manager) return false

            const cleaned = cleanClaudeCodeContent(text, terminalWidth)

            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const json = (manager as any).parse(cleaned)
              const doc = editor.state.schema.nodeFromJSON(json)
              const slice = new Slice(doc.content, 0, 0)
              const tr = view.state.tr.replaceSelection(slice)
              view.dispatch(tr)

              // Show toast with undo after the transaction is applied
              showToast(text)

              return true // Paste handled — prevent default
            }
            catch {
              return false // Fall through to default paste
            }
          },
        },
      }),
    ]
  },
})
