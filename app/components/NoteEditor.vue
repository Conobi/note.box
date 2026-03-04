<script setup lang="ts">
import type { EditorToolbarItem, EditorSuggestionMenuItem } from '@nuxt/ui'
import type { JSONContent } from '@tiptap/vue-3'

const props = defineProps<{
  noteId: string
}>()

const { note, save, flush } = useNote(props.noteId)

function onUpdate(value: JSONContent) {
  save(value)
}

if (import.meta.client) {
  window.addEventListener('beforeunload', flush)
  onBeforeUnmount(() => {
    flush()
    window.removeEventListener('beforeunload', flush)
  })
}

const toolbarItems: EditorToolbarItem[][] = [
  [
    {
      icon: 'i-lucide-heading',
      tooltip: { text: 'Headings' },
      content: { align: 'start' as const },
      items: [
        { kind: 'heading', level: 1, icon: 'i-lucide-heading-1', label: 'Heading 1' },
        { kind: 'heading', level: 2, icon: 'i-lucide-heading-2', label: 'Heading 2' },
        { kind: 'heading', level: 3, icon: 'i-lucide-heading-3', label: 'Heading 3' },
      ],
    },
  ],
  [
    { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', tooltip: { text: 'Bold' } },
    { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', tooltip: { text: 'Italic' } },
    { kind: 'mark', mark: 'underline', icon: 'i-lucide-underline', tooltip: { text: 'Underline' } },
    { kind: 'mark', mark: 'strike', icon: 'i-lucide-strikethrough', tooltip: { text: 'Strikethrough' } },
    { kind: 'mark', mark: 'code', icon: 'i-lucide-code', tooltip: { text: 'Code' } },
  ],
]

const suggestionItems: EditorSuggestionMenuItem[][] = [
  [
    { type: 'label', label: 'Text' },
    { kind: 'paragraph', label: 'Paragraph', icon: 'i-lucide-type' },
    { kind: 'heading', level: 1, label: 'Heading 1', icon: 'i-lucide-heading-1' },
    { kind: 'heading', level: 2, label: 'Heading 2', icon: 'i-lucide-heading-2' },
    { kind: 'heading', level: 3, label: 'Heading 3', icon: 'i-lucide-heading-3' },
  ],
  [
    { type: 'label', label: 'Lists' },
    { kind: 'bulletList', label: 'Bullet List', icon: 'i-lucide-list' },
    { kind: 'orderedList', label: 'Numbered List', icon: 'i-lucide-list-ordered' },
  ],
  [
    { type: 'label', label: 'Insert' },
    { kind: 'blockquote', label: 'Blockquote', icon: 'i-lucide-text-quote' },
    { kind: 'codeBlock', label: 'Code Block', icon: 'i-lucide-square-code' },
    { kind: 'horizontalRule', label: 'Divider', icon: 'i-lucide-separator-horizontal' },
  ],
]
</script>

<template>
  <div v-if="note" class="flex flex-col h-full">
    <UEditor
      v-slot="{ editor }"
      :model-value="note.content"
      content-type="json"
      placeholder="Write, type '/' for commands..."
      :ui="{ base: 'p-4 sm:px-8 py-4 flex-1' }"
      class="flex flex-col h-full"
      @update:model-value="onUpdate"
    >
      <UEditorToolbar :editor="editor" :items="toolbarItems" class="px-4 sm:px-8" />
      <UEditorSuggestionMenu :editor="editor" :items="suggestionItems" />
      <UEditorDragHandle :editor="editor" />
    </UEditor>
  </div>
  <EmptyState v-else />
</template>
