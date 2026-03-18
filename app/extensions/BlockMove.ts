import { Extension } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'
import type { EditorState, Transaction } from '@tiptap/pm/state'

export const BlockMove = Extension.create({
  name: 'blockMove',

  addKeyboardShortcuts() {
    return {
      'Alt-ArrowUp': ({ editor }) => {
        const { state, dispatch } = editor.view
        return (
          moveCodeBlockLine(state, dispatch, 'up') ||
          moveNodeInParent(state, dispatch, 'up')
        )
      },

      'Alt-ArrowDown': ({ editor }) => {
        const { state, dispatch } = editor.view
        return (
          moveCodeBlockLine(state, dispatch, 'down') ||
          moveNodeInParent(state, dispatch, 'down')
        )
      },
    }
  },
})

/**
 * Moves a line up or down within a code block.
 * Returns true if handled, false if not inside a code block.
 */
function moveCodeBlockLine(
  state: EditorState,
  dispatch: (tr: Transaction) => void,
  direction: 'up' | 'down',
): boolean {
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

  if (direction === 'up') {
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
  } else {
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
  }
}

/**
 * Walks up from the current cursor position to find the depth at which the node
 * can be reordered among its siblings. Returns the depth of the moveable node,
 * or null if none found.
 *
 * Reorderable containers: bulletList, orderedList, taskList, blockquote, doc.
 */
function findMoveDepth(state: EditorState): number | null {
  const { $from } = state.selection
  for (let depth = $from.depth; depth >= 1; depth--) {
    const parentType = $from.node(depth - 1).type.name
    if (['bulletList', 'orderedList', 'taskList', 'blockquote', 'table', 'doc'].includes(parentType)) {
      return depth
    }
  }
  return null
}

/**
 * Moves a block up or down within its nearest reorderable container.
 * Handles list items inside lists, paragraphs inside blockquotes, and
 * top-level blocks — at any nesting depth.
 * Returns true if handled (including boundary no-ops), false if not applicable.
 */
function moveNodeInParent(
  state: EditorState,
  dispatch: (tr: Transaction) => void,
  direction: 'up' | 'down',
): boolean {
  const depth = findMoveDepth(state)
  if (depth === null) return false

  const { $from, $to } = state.selection
  const parent = $from.node(depth - 1)

  // Indices of the first and last selected nodes at this depth within their parent
  const firstIndex = $from.index(depth - 1)
  const lastIndex = $to.index(depth - 1)

  // Boundary checks — consume the event so the editor doesn't do anything else
  if (direction === 'up' && firstIndex === 0) return true
  if (direction === 'down' && lastIndex >= parent.childCount - 1) return true

  const tr = state.tr

  if (direction === 'up') {
    const siblingIndex = firstIndex - 1
    const siblingNode = parent.child(siblingIndex)

    // Position just before the sibling node at this depth
    const siblingStart = $from.posAtIndex(siblingIndex, depth - 1)
    const siblingEnd = siblingStart + siblingNode.nodeSize

    // Position just after the last selected node (= before the next sibling)
    const afterLastSelected = $from.posAtIndex(lastIndex + 1, depth - 1)

    // Delete the sibling above, then re-insert it after the last selected node
    tr.delete(siblingStart, siblingEnd)
    const insertPos = tr.mapping.map(afterLastSelected)
    tr.insert(insertPos, siblingNode)
  } else {
    const siblingIndex = lastIndex + 1
    const siblingNode = parent.child(siblingIndex)

    // Position just before the sibling node below the selection
    const siblingStart = $from.posAtIndex(siblingIndex, depth - 1)
    const siblingEnd = siblingStart + siblingNode.nodeSize

    // Position just before the first selected node
    const beforeFirstSelected = $from.posAtIndex(firstIndex, depth - 1)

    // Delete the sibling below, then re-insert it before the first selected node
    tr.delete(siblingStart, siblingEnd)
    tr.insert(tr.mapping.map(beforeFirstSelected), siblingNode)
  }

  tr.setSelection(TextSelection.create(tr.doc, tr.mapping.map($from.pos), tr.mapping.map($to.pos)))
  dispatch(tr)
  return true
}

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
