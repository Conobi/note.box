import { Extension } from '@tiptap/core'

/**
 * When text is selected and the user presses `, toggle inline code
 * on the selection instead of replacing it with a backtick character.
 */
export const BacktickWrap = Extension.create({
  name: 'backtickWrap',

  addKeyboardShortcuts() {
    return {
      '`': ({ editor }) => {
        const { empty } = editor.state.selection
        if (empty) return false

        editor.chain().focus().toggleCode().run()
        return true
      },
    }
  },
})
