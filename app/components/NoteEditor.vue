<script setup lang="ts">
import type { EditorToolbarItem, EditorSuggestionMenuItem } from '@nuxt/ui'
import type { JSONContent, ChainedCommands, Editor } from '@tiptap/vue-3'
import { Extension } from '@tiptap/vue-3'
import { TableKit } from '@tiptap/extension-table/kit'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'

interface EditorHandler {
  canExecute: (editor: Editor) => boolean
  execute: (editor: Editor) => ChainedCommands
  isActive: (editor: Editor) => boolean
  isDisabled?: (editor: Editor) => boolean
}

type TableHandlerKey =
  | 'addColumnAfter' | 'deleteColumn'
  | 'addRowAfter' | 'deleteRow'
  | 'toggleHeaderRow' | 'mergeCells' | 'splitCell'
  | 'deleteTable' | 'table'

type CustomHandlers = Record<TableHandlerKey, EditorHandler>

const TableKeymap = Extension.create({
  name: 'tableKeymap',
  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => this.editor.commands.addRowAfter(),
      'Mod-Shift-Backspace': () => this.editor.commands.deleteTable(),
    }
  },
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const editorExtensions: any[] = [
  TableKit,
  TableKeymap,
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
]

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
  window.history.replaceState(window.history.state, '', `/notes/${newSlug}`)
})

const initialContent = note.value?.content

useHead({
  title: computed(() => {
    const title = note.value?.title || t('editor.untitled')
    return `${title} - note.box`
  }),
})

watch(note, (n) => {
  if (!n) router.replace('/')
}, { immediate: true })

function onUpdate(value: JSONContent) {
  save(value)
}

const handlers: CustomHandlers = {
  table: {
    canExecute: () => true,
    execute: (editor: Editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }),
    isActive: (editor: Editor) => editor.isActive('table'),
  },
  addColumnAfter: {
    canExecute: (editor: Editor) => editor.can().addColumnAfter(),
    execute: (editor: Editor) => editor.chain().focus().addColumnAfter(),
    isActive: () => false,
  },
  deleteColumn: {
    canExecute: (editor: Editor) => editor.can().deleteColumn(),
    execute: (editor: Editor) => editor.chain().focus().deleteColumn(),
    isActive: () => false,
  },
  addRowAfter: {
    canExecute: (editor: Editor) => editor.can().addRowAfter(),
    execute: (editor: Editor) => editor.chain().focus().addRowAfter(),
    isActive: () => false,
  },
  deleteRow: {
    canExecute: (editor: Editor) => editor.can().deleteRow(),
    execute: (editor: Editor) => editor.chain().focus().deleteRow(),
    isActive: () => false,
  },
  toggleHeaderRow: {
    canExecute: (editor: Editor) => editor.can().toggleHeaderRow(),
    execute: (editor: Editor) => editor.chain().focus().toggleHeaderRow(),
    isActive: () => false,
  },
  mergeCells: {
    canExecute: (editor: Editor) => editor.can().mergeCells(),
    execute: (editor: Editor) => editor.chain().focus().mergeCells(),
    isActive: () => false,
  },
  splitCell: {
    canExecute: (editor: Editor) => editor.can().splitCell(),
    execute: (editor: Editor) => editor.chain().focus().splitCell(),
    isActive: () => false,
  },
  deleteTable: {
    canExecute: (editor: Editor) => editor.can().deleteTable(),
    execute: (editor: Editor) => editor.chain().focus().deleteTable(),
    isActive: () => false,
  },
}

if (import.meta.client) {
  window.addEventListener('beforeunload', flush)
  onBeforeUnmount(() => {
    flush()
    window.removeEventListener('beforeunload', flush)
  })
}

const toolbarItems = computed<EditorToolbarItem<CustomHandlers>[][]>(() => [
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
    { kind: 'link', icon: 'i-lucide-link', tooltip: { text: t('editor.link'), kbds: ['meta', 'K'] } },
  ],
])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shouldShowTableToolbar(props: { editor: any }) {
  return props.editor.isActive('table') && props.editor.state.selection.empty
}

const tableToolbarItems = computed<EditorToolbarItem<CustomHandlers>[][]>(() => [
  [
    { kind: 'addColumnAfter', icon: 'i-lucide-columns-3', tooltip: { text: t('editor.addColumnAfter') } },
    { kind: 'addRowAfter', icon: 'i-lucide-rows-3', tooltip: { text: t('editor.addRowAfter') } },
  ],
  [
    { kind: 'deleteColumn', icon: 'i-lucide-columns-2', tooltip: { text: t('editor.deleteColumn') } },
    { kind: 'deleteRow', icon: 'i-lucide-rows-2', tooltip: { text: t('editor.deleteRow') } },
  ],
  [
    { kind: 'toggleHeaderRow', icon: 'i-lucide-heading', tooltip: { text: t('editor.toggleHeaderRow') } },
    { kind: 'mergeCells', icon: 'i-lucide-merge', tooltip: { text: t('editor.mergeCells') } },
    { kind: 'splitCell', icon: 'i-lucide-split', tooltip: { text: t('editor.splitCell') } },
  ],
  [
    { kind: 'deleteTable', icon: 'i-lucide-trash-2', tooltip: { text: t('editor.deleteTable') } },
  ],
])

const suggestionItems = computed<EditorSuggestionMenuItem<CustomHandlers>[][]>(() => [
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
    { kind: 'taskList', label: t('editor.taskList'), icon: 'i-lucide-list-checks' },
  ],
  [
    { type: 'label', label: t('editor.insert') },
    { kind: 'blockquote', label: t('editor.blockquote'), icon: 'i-lucide-text-quote' },
    { kind: 'codeBlock', label: t('editor.codeBlock'), icon: 'i-lucide-square-code' },
    { kind: 'horizontalRule', label: t('editor.divider'), icon: 'i-lucide-separator-horizontal' },
    { kind: 'table', label: t('editor.table'), icon: 'i-lucide-table' },
  ],
])
</script>

<template>
  <div v-if="note" class="zen-editor pt-12 sm:pt-16">
    <UEditor
      v-slot="{ editor }"
      :model-value="initialContent"
      :extensions="editorExtensions"
      :handlers="handlers"
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
      <UEditorToolbar :editor="editor" :items="tableToolbarItems" layout="bubble" plugin-key="tableToolbar" :should-show="shouldShowTableToolbar" />
      <UEditorSuggestionMenu :editor="editor" :items="suggestionItems" />
      <UEditorDragHandle :editor="editor" />
    </UEditor>
  </div>
</template>
