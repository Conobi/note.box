import { Extension } from '@tiptap/core'

/**
 * Ctrl+Space toggles the checked state of task items.
 * Independent: only affects task items directly under cursor / in selection.
 * No cascading to children.
 *
 * Uniform-state logic:
 * - If any touched task is unchecked → check all
 * - If all touched tasks are already checked → uncheck all
 */
export const TaskToggle = Extension.create({
  name: 'taskToggle',

  addKeyboardShortcuts() {
    return {
      'Mod-Space': ({ editor }) => {
        const { state } = editor
        const { doc, selection, tr } = state
        const { from, to } = selection

        const taskItemType = state.schema.nodes.taskItem
        if (!taskItemType) return false

        // Collect task items whose direct content (paragraph) overlaps
        // with the selection. This avoids cascading: when the cursor is
        // inside a nested child task, we don't accidentally toggle the
        // parent task item (whose full span includes the nested list).
        const tasks: { pos: number, checked: boolean }[] = []
        doc.nodesBetween(from, to, (node, pos) => {
          if (node.type !== taskItemType) return
          const firstChild = node.firstChild
          if (!firstChild) return
          // Only match if the selection overlaps with this task item's
          // own paragraph, not its nested task lists
          const contentStart = pos + 1
          const contentEnd = pos + 1 + firstChild.nodeSize
          if (from < contentEnd && to >= contentStart) {
            tasks.push({ pos, checked: node.attrs.checked })
          }
        })

        if (tasks.length === 0) return false

        // If any is unchecked, check all; otherwise uncheck all
        const hasUnchecked = tasks.some(t => !t.checked)
        const newChecked = hasUnchecked

        for (const task of tasks) {
          const node = doc.nodeAt(task.pos)!
          tr.setNodeMarkup(task.pos, undefined, {
            ...node.attrs,
            checked: newChecked,
          })
        }

        editor.view.dispatch(tr)
        return true
      },
    }
  },
})
