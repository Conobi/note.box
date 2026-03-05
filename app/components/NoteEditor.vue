<script setup lang="ts">
import type { EditorToolbarItem, EditorSuggestionMenuItem } from '@nuxt/ui'
import type { JSONContent } from '@tiptap/vue-3'

const props = defineProps<{
  noteSlug: string
}>()

const router = useRouter()
const { getBySlug } = useNotes()

const noteFromSlug = computed(() => getBySlug(props.noteSlug))
const noteId = computed(() => noteFromSlug.value?.id)

const { note, save, flush, onSlugUpdate } = useNote(noteId.value ?? '')

onSlugUpdate((newSlug) => {
  router.replace(`/notes/${newSlug}`)
})

watch(note, (n) => {
  if (!n) router.replace('/')
}, { immediate: true })

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
  <div v-if="note" class="zen-editor pt-12 sm:pt-16">
    <UEditor
      v-slot="{ editor }"
      :model-value="note.content"
      content-type="json"
      :placeholder="{
        placeholder: ({ node, hasAnchor }: { node: any, hasAnchor: boolean }) => {
          if (node.type.name === 'heading' && node.attrs.level === 1) return 'Untitled'
          if (hasAnchor) return 'Write, type \'/\' for commands...'
          return ''
        },
        showOnlyCurrent: false,
      }"
      :ui="{ base: 'py-4 min-h-[70vh]' }"
      @update:model-value="onUpdate"
    >
      <UEditorToolbar :editor="editor" :items="toolbarItems" layout="bubble" />
      <UEditorSuggestionMenu :editor="editor" :items="suggestionItems" />
      <UEditorDragHandle :editor="editor" />
    </UEditor>
  </div>
</template>
