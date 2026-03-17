import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Slice } from '@tiptap/pm/model'

export const MarkdownPaste = Extension.create({
  name: 'markdownPaste',

  addProseMirrorPlugins() {
    const editor = this.editor

    return [
      new Plugin({
        key: new PluginKey('markdownPaste'),
        props: {
          // clipboardTextParser is the ProseMirror prop for converting pasted
          // plain text into a Slice. It's called BEFORE handlePaste.
          // The `plain` arg is true when Shift+V is used (force plain text).
          // ProseMirror types the return as Slice, but null at runtime signals
          // "fall through to default". We cast through unknown to satisfy TS.
          // Reference: aguingand/tiptap-markdown uses the same approach.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          clipboardTextParser: (function (text: string, _$context: unknown, plain: boolean): Slice | null {
            // Shift+paste = don't parse as Markdown, let default handle it
            if (plain) return null

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const manager = (editor as any).storage.markdown?.manager
            if (!manager) return null

            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const json = (manager as any).parse(text)
              const doc = editor.state.schema.nodeFromJSON(json)
              return new Slice(doc.content, 0, 0)
            }
            catch {
              // If parsing fails, fall back to default paste behavior
              return null
            }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          }) as any,
        },
      }),
    ]
  },
})
