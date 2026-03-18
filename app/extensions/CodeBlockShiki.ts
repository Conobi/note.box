import CodeBlockShikiBase from 'tiptap-extension-code-block-shiki'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import CodeBlockNodeView from '~/components/CodeBlockNodeView.vue'

export const CodeBlockShiki = CodeBlockShikiBase.extend({
  addNodeView() {
    return VueNodeViewRenderer(CodeBlockNodeView)
  },
})
