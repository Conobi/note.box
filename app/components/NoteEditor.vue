<script setup lang="ts">
import type { EditorToolbarItem, EditorSuggestionMenuItem } from '@nuxt/ui'
import type { JSONContent, ChainedCommands, Editor } from '@tiptap/vue-3'
import { Extension } from '@tiptap/vue-3'
import { wrappingInputRule } from '@tiptap/core'
import type { ExtendedRegExpMatchArray } from '@tiptap/core'
import { TableKit } from '@tiptap/extension-table/kit'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { CellSelection } from '@tiptap/pm/tables'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'

interface EditorHandler {
  canExecute: (editor: Editor) => boolean
  execute: (editor: Editor) => ChainedCommands
  isActive: (editor: Editor) => boolean
  isDisabled?: (editor: Editor) => boolean
}

type TableHandlerKey =
  | 'addColumnBefore' | 'addColumnAfter' | 'deleteColumn'
  | 'addRowBefore' | 'addRowAfter' | 'deleteRow'
  | 'toggleHeaderRow' | 'mergeCells' | 'splitCell'
  | 'deleteTable' | 'table'

type CustomHandlers = Record<TableHandlerKey, EditorHandler>

const editorRef = shallowRef<Editor>()
const isInTable = ref(false)

const TableKeymap = Extension.create({
  name: 'tableKeymap',
  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => this.editor.commands.addRowAfter(),
      'Mod-Shift-Backspace': () => this.editor.commands.deleteTable(),
      'Mod-Shift-t': () => this.editor.commands.insertTable({ rows: 3, cols: 3, withHeaderRow: true }),
      'Delete': () => {
        const { selection } = this.editor.state
        if (!(selection instanceof CellSelection)) return false
        if (selection.isRowSelection()) return this.editor.commands.deleteRow()
        if (selection.isColSelection()) return this.editor.commands.deleteColumn()
        return false
      },
      'Backspace': () => {
        const { selection } = this.editor.state
        if (!(selection instanceof CellSelection)) return false
        if (selection.isRowSelection()) return this.editor.commands.deleteRow()
        if (selection.isColSelection()) return this.editor.commands.deleteColumn()
        return false
      },
    }
  },
})

// Adds "[ ] ", "[] ", "[x] ", "[*] " input rules for task lists
const TaskListInputRules = Extension.create({
  name: 'taskListInputRules',
  addInputRules() {
    const taskItemType = this.editor.schema.nodes.taskItem
    if (!taskItemType) return []

    return [
      wrappingInputRule({
        find: /^\s*\[([xX* ]?)\]\s$/,
        type: taskItemType,
        getAttributes: (match: ExtendedRegExpMatchArray) => ({
          checked: match[1] === 'x' || match[1] === 'X' || match[1] === '*',
        }),
      }),
    ]
  },
})

let _originalGetJSON: (() => ReturnType<Editor['getJSON']>) | null = null

const EditorRefCapture = Extension.create({
  name: 'editorRefCapture',
  onCreate() {
    // this.editor is the core Editor, editorRef expects the Vue Editor
    editorRef.value = this.editor as unknown as Editor
    // Prevent UEditor's per-keystroke getJSON() tree walk.
    // Our save path calls the original via a lazy getter.
    _originalGetJSON = this.editor.getJSON.bind(this.editor)
    this.editor.getJSON = () => ({ type: 'doc', content: [] })
  },
  onSelectionUpdate() {
    isInTable.value = this.editor.isActive('table')
  },
})

const TableSelectGutter = Extension.create({
  name: 'tableSelectGutter',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('tableSelectGutter'),
        props: {
          handleDOMEvents: {
            mousedown: (view, event) => {
              const target = event.target as HTMLElement
              const cell = target.closest('td, th') as HTMLTableCellElement | null
              if (!cell) return false

              const table = cell.closest('table') as HTMLTableElement | null
              const row = cell.closest('tr') as HTMLTableRowElement | null
              if (!table || !row) return false

              const rect = cell.getBoundingClientRect()
              const isFirstCol = cell.cellIndex === 0
              const isFirstRow = row.rowIndex === 0

              const inLeftGutter = isFirstCol && (event.clientX - rect.left < 12)
              const inTopGutter = isFirstRow && (event.clientY - rect.top < 12)

              if (!inLeftGutter && !inTopGutter) return false

              const pos = view.posAtDOM(cell, 0)
              const $pos = view.state.doc.resolve(pos)

              let cellDepth = $pos.depth
              while (cellDepth > 0) {
                if (['tableCell', 'tableHeader'].includes($pos.node(cellDepth).type.name)) break
                cellDepth--
              }
              if (cellDepth === 0) return false

              const $cell = view.state.doc.resolve($pos.before(cellDepth))
              const selection = inLeftGutter
                ? CellSelection.rowSelection($cell)
                : CellSelection.colSelection($cell)

              view.dispatch(view.state.tr.setSelection(selection))
              event.preventDefault()
              return true
            },
          },
        },
      }),
    ]
  },
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const editorExtensions: any[] = [
  TableKit.configure({
    table: { resizable: true, handleWidth: 5, cellMinWidth: 50 },
  }),
  TableKeymap,
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
  TaskListInputRules,
  EditorRefCapture,
  TableSelectGutter,
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
  if (_originalGetJSON) {
    const getJSON = _originalGetJSON
    save(() => getJSON() as JSONContent)
  }
  else {
    save(() => value)
  }
}

const handlers: CustomHandlers = {
  table: {
    canExecute: () => true,
    execute: (editor: Editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }),
    isActive: (editor: Editor) => editor.isActive('table'),
  },
  addColumnBefore: {
    canExecute: (editor: Editor) => editor.can().addColumnBefore(),
    execute: (editor: Editor) => editor.chain().focus().addColumnBefore(),
    isActive: () => false,
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
  addRowBefore: {
    canExecute: (editor: Editor) => editor.can().addRowBefore(),
    execute: (editor: Editor) => editor.chain().focus().addRowBefore(),
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
    { kind: 'link', icon: 'i-lucide-link', tooltip: { text: t('editor.link') } },
  ],
])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shouldShowTableToolbar(props: { editor: any }) {
  return props.editor.isActive('table') && props.editor.state.selection.empty
}

const tableToolbarItems = computed<EditorToolbarItem<CustomHandlers>[][]>(() => [
  [
    { kind: 'addColumnBefore', icon: 'i-lucide-columns-3', tooltip: { text: t('editor.addColumnBefore') } },
    { kind: 'addColumnAfter', icon: 'i-lucide-columns-3', tooltip: { text: t('editor.addColumnAfter') } },
  ],
  [
    { kind: 'addRowBefore', icon: 'i-lucide-rows-3', tooltip: { text: t('editor.addRowBefore') } },
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

const tableContextMenuItems = computed(() => {
  const editor = editorRef.value
  if (!editor) return []
  return [
    [
      { label: t('editor.addColumnBefore'), icon: 'i-lucide-columns-3', onSelect: () => editor.chain().focus().addColumnBefore().run() },
      { label: t('editor.addColumnAfter'), icon: 'i-lucide-columns-3', onSelect: () => editor.chain().focus().addColumnAfter().run() },
      { label: t('editor.deleteColumn'), icon: 'i-lucide-columns-2', onSelect: () => editor.chain().focus().deleteColumn().run() },
    ],
    [
      { label: t('editor.addRowBefore'), icon: 'i-lucide-rows-3', onSelect: () => editor.chain().focus().addRowBefore().run() },
      { label: t('editor.addRowAfter'), icon: 'i-lucide-rows-3', onSelect: () => editor.chain().focus().addRowAfter().run() },
      { label: t('editor.deleteRow'), icon: 'i-lucide-rows-2', onSelect: () => editor.chain().focus().deleteRow().run() },
    ],
    [
      { label: t('editor.toggleHeaderRow'), icon: 'i-lucide-heading', onSelect: () => editor.chain().focus().toggleHeaderRow().run() },
      { label: t('editor.mergeCells'), icon: 'i-lucide-merge', onSelect: () => editor.chain().focus().mergeCells().run() },
      { label: t('editor.splitCell'), icon: 'i-lucide-split', onSelect: () => editor.chain().focus().splitCell().run() },
    ],
    [
      { label: t('editor.deleteTable'), icon: 'i-lucide-trash-2', onSelect: () => editor.chain().focus().deleteTable().run() },
    ],
  ]
})

function onContextMenu(event: MouseEvent) {
  if (!editorRef.value?.isActive('table')) {
    event.stopPropagation()
  }
}

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
  <UContextMenu v-if="note" :items="tableContextMenuItems">
    <div class="zen-editor pt-12 sm:pt-16" @contextmenu="onContextMenu">
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
  </UContextMenu>
</template>
