<script setup lang="ts">
import type { EditorToolbarItem, EditorSuggestionMenuItem } from '@nuxt/ui'
import type { JSONContent } from '@tiptap/vue-3'

const props = defineProps<{
  noteSlug: string
}>()

const { t } = useI18n()
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

const toolbarItems = computed<EditorToolbarItem[][]>(() => [
  [
    {
      icon: 'i-lucide-heading',
      tooltip: { text: t('editor.headings') },
      content: { align: 'start' as const },
      items: [
        { kind: 'heading', level: 1, icon: 'i-lucide-heading-1', label: t('editor.heading1') },
        { kind: 'heading', level: 2, icon: 'i-lucide-heading-2', label: t('editor.heading2') },
        { kind: 'heading', level: 3, icon: 'i-lucide-heading-3', label: t('editor.heading3') },
      ],
    },
  ],
  [
    { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', tooltip: { text: t('editor.bold'), kbds: ['meta', 'B'] } },
    { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', tooltip: { text: t('editor.italic'), kbds: ['meta', 'I'] } },
    { kind: 'mark', mark: 'underline', icon: 'i-lucide-underline', tooltip: { text: t('editor.underline'), kbds: ['meta', 'U'] } },
    { kind: 'mark', mark: 'strike', icon: 'i-lucide-strikethrough', tooltip: { text: t('editor.strikethrough'), kbds: ['meta', 'shift', 'S'] } },
    { kind: 'mark', mark: 'code', icon: 'i-lucide-code', tooltip: { text: t('editor.code'), kbds: ['meta', 'E'] } },
  ],
])

const suggestionItems = computed<EditorSuggestionMenuItem[][]>(() => [
  [
    { type: 'label', label: t('editor.text') },
    { kind: 'paragraph', label: t('editor.paragraph'), icon: 'i-lucide-type' },
    { kind: 'heading', level: 1, label: t('editor.heading1'), icon: 'i-lucide-heading-1' },
    { kind: 'heading', level: 2, label: t('editor.heading2'), icon: 'i-lucide-heading-2' },
    { kind: 'heading', level: 3, label: t('editor.heading3'), icon: 'i-lucide-heading-3' },
  ],
  [
    { type: 'label', label: t('editor.lists') },
    { kind: 'bulletList', label: t('editor.bulletList'), icon: 'i-lucide-list' },
    { kind: 'orderedList', label: t('editor.numberedList'), icon: 'i-lucide-list-ordered' },
  ],
  [
    { type: 'label', label: t('editor.insert') },
    { kind: 'blockquote', label: t('editor.blockquote'), icon: 'i-lucide-text-quote' },
    { kind: 'codeBlock', label: t('editor.codeBlock'), icon: 'i-lucide-square-code' },
    { kind: 'horizontalRule', label: t('editor.divider'), icon: 'i-lucide-separator-horizontal' },
  ],
])
</script>

<template>
  <div v-if="note" class="zen-editor pt-12 sm:pt-16">
    <UEditor
      v-slot="{ editor }"
      :model-value="note.content"
      content-type="json"
      :placeholder="{
        placeholder: ({ node, hasAnchor }: { node: any, hasAnchor: boolean }) => {
          if (node.type.name === 'heading' && node.attrs.level === 1) return t('editor.untitled')
          if (hasAnchor) return t('editor.placeholder')
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
