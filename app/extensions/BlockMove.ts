import { Extension } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'

export const BlockMove = Extension.create({
  name: 'blockMove',

  addKeyboardShortcuts() {
    return {
      'Alt-ArrowUp': ({ editor }) => {
        const { state, dispatch } = editor.view
        const { selection } = state
        const { $from, $to } = selection

        // Only act inside a code block
        if ($from.parent.type.name !== 'codeBlock') return false

        const blockStart = $from.start() // position of first char in the code block
        const text = $from.parent.textContent
        const lines = text.split('\n')

        // Determine which lines the selection covers (0-based indices)
        const fromOffset = $from.parentOffset
        const toOffset = $to.parentOffset

        const firstLineIndex = offsetToLineIndex(lines, fromOffset)
        const lastLineIndex = offsetToLineIndex(lines, toOffset)

        // Can't move up from the first line
        if (firstLineIndex === 0) return true

        // Compute the new text after swapping lines up
        const swapLine = lines[firstLineIndex - 1]!
        const newLines = [...lines]
        newLines.splice(
          firstLineIndex - 1,
          lastLineIndex - firstLineIndex + 2,
          ...newLines.slice(firstLineIndex, lastLineIndex + 1),
          swapLine,
        )

        const newText = newLines.join('\n')

        // Shift selection up by the swapped line's length + 1 (\n)
        const shift = swapLine.length + 1
        const newFrom = blockStart + fromOffset - shift
        const newTo = blockStart + toOffset - shift

        const tr = state.tr.insertText(newText, blockStart, $from.end())
        tr.setSelection(TextSelection.create(tr.doc, newFrom, newTo))
        dispatch(tr)
        return true
      },

      'Alt-ArrowDown': ({ editor }) => {
        const { state, dispatch } = editor.view
        const { selection } = state
        const { $from, $to } = selection

        // Only act inside a code block
        if ($from.parent.type.name !== 'codeBlock') return false

        const blockStart = $from.start()
        const text = $from.parent.textContent
        const lines = text.split('\n')

        const fromOffset = $from.parentOffset
        const toOffset = $to.parentOffset

        const firstLineIndex = offsetToLineIndex(lines, fromOffset)
        const lastLineIndex = offsetToLineIndex(lines, toOffset)

        // Can't move down from the last line
        if (lastLineIndex === lines.length - 1) return true

        // Compute the new text after swapping lines down
        const swapLine = lines[lastLineIndex + 1]!
        const newLines = [...lines]
        newLines.splice(
          firstLineIndex,
          lastLineIndex - firstLineIndex + 2,
          swapLine,
          ...newLines.slice(firstLineIndex, lastLineIndex + 1),
        )

        const newText = newLines.join('\n')

        // Shift selection down by the swapped line's length + 1 (\n)
        const shift = swapLine.length + 1
        const newFrom = blockStart + fromOffset + shift
        const newTo = blockStart + toOffset + shift

        const tr = state.tr.insertText(newText, blockStart, $from.end())
        tr.setSelection(TextSelection.create(tr.doc, newFrom, newTo))
        dispatch(tr)
        return true
      },
    }
  },
})

/**
 * Given the lines array and a character offset within the joined text,
 * returns the 0-based index of the line that contains that offset.
 */
function offsetToLineIndex(lines: string[], offset: number): number {
  let pos = 0
  for (let i = 0; i < lines.length; i++) {
    const lineEnd = pos + lines[i]!.length
    // The offset is within this line, or we're at the newline character
    // after the line (i.e. offset === lineEnd and not the last line)
    if (offset <= lineEnd) return i
    pos = lineEnd + 1 // +1 for the '\n'
  }
  return lines.length - 1
}
