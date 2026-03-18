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
          moveTopLevelBlock(state, dispatch, 'up')
        )
      },

      'Alt-ArrowDown': ({ editor }) => {
        const { state, dispatch } = editor.view
        return (
          moveCodeBlockLine(state, dispatch, 'down') ||
          moveTopLevelBlock(state, dispatch, 'down')
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
 * Moves a top-level block (direct child of the document) up or down.
 * Returns true if handled (including boundary no-ops), false if not applicable.
 */
function moveTopLevelBlock(
  state: EditorState,
  dispatch: (tr: Transaction) => void,
  direction: 'up' | 'down',
): boolean {
  const { selection, doc } = state
  const { $from, $to } = selection

  // Only handle blocks that are direct children of the document (depth 1)
  if ($from.depth !== 1) return false

  // Find the first and last top-level block nodes touched by the selection
  // $from.before(1) is the position just before the node at depth 1
  const firstBlockPos = $from.before(1)
  const lastBlockPos = $to.before(1)

  const firstBlockIndex = doc.resolve(firstBlockPos + 1).index(0)
  const lastBlockIndex = doc.resolve(lastBlockPos + 1).index(0)

  if (direction === 'up') {
    // Can't move up if the first selected block is already the first child
    if (firstBlockIndex === 0) return true

    // The sibling block just above the first selected block
    const siblingIndex = firstBlockIndex - 1
    const siblingNode = doc.child(siblingIndex)

    // Calculate the start position of the sibling node
    // (sum of sizes of all nodes before it, plus 1 for the doc start token)
    let siblingStart = 0
    for (let i = 0; i < siblingIndex; i++) {
      siblingStart += doc.child(i).nodeSize
    }
    // siblingStart is now the absolute position of the sibling node's opening token

    const siblingEnd = siblingStart + siblingNode.nodeSize

    // The end position of the last selected block
    let lastBlockEnd = 0
    for (let i = 0; i <= lastBlockIndex; i++) {
      lastBlockEnd += doc.child(i).nodeSize
    }

    // To move up: delete the sibling above the selection, then re-insert it after the last selected block
    const tr = state.tr

    // Delete the sibling (which is above our selection)
    tr.delete(siblingStart, siblingEnd)

    // After deletion, the insertion point is: lastBlockEnd - siblingNode.nodeSize
    // because everything from siblingEnd onward shifted left by siblingNode.nodeSize
    const insertPos = lastBlockEnd - siblingNode.nodeSize

    tr.insert(insertPos, siblingNode)

    // Preserve selection via mapping (positions shifted left by siblingNode.nodeSize)
    const newFrom = tr.mapping.map($from.pos)
    const newTo = tr.mapping.map($to.pos)
    tr.setSelection(TextSelection.create(tr.doc, newFrom, newTo))

    dispatch(tr)
    return true
  } else {
    // Can't move down if the last selected block is the last child
    if (lastBlockIndex === doc.childCount - 1) return true

    // The sibling block just below the last selected block
    const siblingIndex = lastBlockIndex + 1
    const siblingNode = doc.child(siblingIndex)

    // Calculate the start position of the sibling node
    let siblingStart = 0
    for (let i = 0; i < siblingIndex; i++) {
      siblingStart += doc.child(i).nodeSize
    }

    const siblingEnd = siblingStart + siblingNode.nodeSize

    // The start position of the first selected block
    let firstBlockStart = 0
    for (let i = 0; i < firstBlockIndex; i++) {
      firstBlockStart += doc.child(i).nodeSize
    }

    // To move down: delete the sibling below the selection, then re-insert it before the first selected block
    const tr = state.tr

    // Delete the sibling (which is below our selection)
    tr.delete(siblingStart, siblingEnd)

    // Insert the sibling before the first selected block
    // firstBlockStart did not change since we deleted after it
    tr.insert(firstBlockStart, siblingNode)

    // Preserve selection via mapping
    const newFrom = tr.mapping.map($from.pos)
    const newTo = tr.mapping.map($to.pos)
    tr.setSelection(TextSelection.create(tr.doc, newFrom, newTo))

    dispatch(tr)
    return true
  }
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
