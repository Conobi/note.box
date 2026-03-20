import { Extension } from '@tiptap/core'

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
