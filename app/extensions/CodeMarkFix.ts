import { Extension } from '@tiptap/core'

export const CodeMarkFix = Extension.create({
  name: 'codeMarkFix',

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        // If cursor is inside a code mark, remove it before creating a new block
        const codeMarkType = editor.schema.marks.code
        if (!codeMarkType) return false
        if (!editor.isActive('code')) return false

        // Remove the code mark from the current stored marks so the new
        // block doesn't inherit it
        editor.chain()
          .command(({ tr }) => {
            tr.removeStoredMark(codeMarkType)
            return true
          })
          .run()

        // Let the default Enter handler proceed
        return false
      },
      Backspace: ({ editor }) => {
        // At position 0 of a block with code mark, don't merge code marks across blocks
        const { $from, empty } = editor.state.selection
        if (!empty) return false
        if ($from.parentOffset !== 0) return false
        if (!editor.isActive('code')) return false

        const codeMarkType = editor.schema.marks.code
        if (!codeMarkType) return false

        // Remove stored code mark before the default backspace merges blocks
        editor.chain()
          .command(({ tr }) => {
            tr.removeStoredMark(codeMarkType)
            return true
          })
          .run()

        return false
      },
    }
  },
})
