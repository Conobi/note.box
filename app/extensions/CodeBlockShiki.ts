// app/extensions/CodeBlockShiki.ts
import { CodeBlock } from '@tiptap/extension-code-block'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import { textblockTypeInputRule } from '@tiptap/core'
import CodeBlockNodeView from '~/components/CodeBlockNodeView.vue'

export const CodeBlockShiki = CodeBlock.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      language: {
        default: null,
        parseHTML: element => element.getAttribute('data-language'),
        renderHTML: (attributes) => {
          if (!attributes.language) return {}
          return { 'data-language': attributes.language }
        },
      },
    }
  },

  addInputRules() {
    return [
      // ```lang  or just ```
      textblockTypeInputRule({
        find: /^```([a-zA-Z0-9_+-]*)\s$/,
        type: this.type,
        getAttributes: match => ({
          language: match[1] || null,
        }),
      }),
    ]
  },

  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      // Exit on Enter when on an empty last line
      Enter: ({ editor }) => {
        const { $from, empty } = editor.state.selection
        if (!empty) return false
        if ($from.parent.type.name !== this.type.name) return false

        // Check if we're at the end of the block and the last line is empty
        const cursorAtEnd = $from.parentOffset === $from.parent.content.size
        const lastLineText = $from.parent.textContent
        const lines = lastLineText.split('\n')
        const currentLineEmpty = lines[lines.length - 1] === ''

        if (cursorAtEnd && currentLineEmpty && lines.length > 1) {
          // Remove the trailing newline and exit the code block
          const pos = $from.pos
          editor.chain()
            .command(({ tr }) => {
              // Delete the trailing newline character
              tr.delete(pos - 1, pos)
              return true
            })
            .exitCode()
            .run()
          return true
        }

        return false
      },
      // Arrow down on last line exits
      ArrowDown: ({ editor }) => {
        const { $from, empty } = editor.state.selection
        if (!empty) return false
        if ($from.parent.type.name !== this.type.name) return false

        const isAtEnd = $from.parentOffset === $from.parent.content.size
        if (isAtEnd) {
          return editor.commands.exitCode()
        }
        return false
      },
    }
  },

  addNodeView() {
    return VueNodeViewRenderer(CodeBlockNodeView)
  },
})
