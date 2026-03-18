import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { DOMSerializer } from '@tiptap/pm/model'
import type { Node as ProseMirrorNode, Schema, DOMOutputSpec, Slice  } from '@tiptap/pm/model'
import type { EditorView } from '@tiptap/pm/view'
import { jsonContentToMarkdown } from '~/utils/markdown'
import type { CopyFormat } from '~/types/settings'

const CELL_STYLE = 'border:1px solid #ccc;padding:6px 12px'

export function serializeCodeBlock(node: ProseMirrorNode): DOMOutputSpec {
  const lang = node.attrs.language
  const codeAttrs: Record<string, string> = {}
  if (lang) codeAttrs.class = `language-${lang}`
  return ['pre', ['code', codeAttrs, 0]]
}

export function serializeTableCell(node: ProseMirrorNode): DOMOutputSpec {
  const tag = node.type.name === 'tableHeader' ? 'th' : 'td'
  const attrs: Record<string, string> = { style: CELL_STYLE }
  if (node.attrs.colspan && node.attrs.colspan > 1) attrs.colspan = String(node.attrs.colspan)
  if (node.attrs.rowspan && node.attrs.rowspan > 1) attrs.rowspan = String(node.attrs.rowspan)
  return [tag, attrs, 0]
}

function serializeTable(): DOMOutputSpec {
  return ['table', { style: 'border-collapse:collapse' }, 0]
}

function serializeTableRow(): DOMOutputSpec {
  return ['tr', 0]
}

export function serializeTaskItem(node: ProseMirrorNode): DOMOutputSpec {
  const checked = node.attrs.checked
  if (checked) {
    return ['li', ['input', { type: 'checkbox', checked: '', disabled: '' }], 0]
  }
  return ['li', ['input', { type: 'checkbox', disabled: '' }], 0]
}

export function serializeTaskList(): DOMOutputSpec {
  return ['ul', { style: 'list-style:none;padding-left:0' }, 0]
}

export function createClipboardSerializer(schema: Schema): DOMSerializer {
  const base = DOMSerializer.fromSchema(schema)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodes = { ...base.nodes } as Record<string, any>

  if (schema.nodes.codeBlock) nodes.codeBlock = serializeCodeBlock
  if (schema.nodes.table) nodes.table = serializeTable
  if (schema.nodes.tableRow) nodes.tableRow = serializeTableRow
  if (schema.nodes.tableHeader) nodes.tableHeader = serializeTableCell
  if (schema.nodes.tableCell) nodes.tableCell = serializeTableCell
  if (schema.nodes.taskItem) nodes.taskItem = serializeTaskItem
  if (schema.nodes.taskList) nodes.taskList = serializeTaskList

  return new DOMSerializer(nodes, base.marks)
}

function sliceToMarkdown(slice: Slice): string {
  const json = { type: 'doc', content: slice.content.toJSON() }
  return jsonContentToMarkdown(json)
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function serializeSliceToHTML(slice: Slice, serializer: DOMSerializer, view: EditorView): string {
  const fragment = serializer.serializeFragment(slice.content, { document: view.dom.ownerDocument })
  const div = view.dom.ownerDocument.createElement('div')
  div.appendChild(fragment)

  // Post-process: wrap table rows in thead/tbody based on cell node types.
  // DOMSerializer serializes rows individually and can't group them,
  // so we detect header rows by checking for <th> elements and wrap accordingly.
  div.querySelectorAll('table').forEach((table) => {
    const rows = Array.from(table.querySelectorAll(':scope > tr'))
    if (rows.length === 0) return

    const thead = table.ownerDocument.createElement('thead')
    const tbody = table.ownerDocument.createElement('tbody')

    for (const row of rows) {
      if (row.querySelector('th')) {
        thead.appendChild(row)
      }
      else {
        tbody.appendChild(row)
      }
    }

    while (table.firstChild) table.removeChild(table.firstChild)
    if (thead.hasChildNodes()) table.appendChild(thead)
    if (tbody.hasChildNodes()) table.appendChild(tbody)
  })

  return div.innerHTML
}

function handleClipboard(getCopyFormat: () => CopyFormat, serializer: DOMSerializer) {
  return (view: EditorView, event: ClipboardEvent): boolean => {
    const { state } = view
    const { selection } = state
    if (selection.empty) return false

    const slice = selection.content()
    const markdown = sliceToMarkdown(slice)

    if (getCopyFormat() === 'html') {
      const html = serializeSliceToHTML(slice, serializer, view)
      event.clipboardData?.setData('text/html', html)
      event.clipboardData?.setData('text/plain', markdown)
    }
    else {
      event.clipboardData?.setData('text/html', `<pre>${escapeHtml(markdown)}</pre>`)
      event.clipboardData?.setData('text/plain', markdown)
    }

    event.preventDefault()
    return true
  }
}

interface ClipboardCopyOptions {
  getCopyFormat: () => CopyFormat
}

export const ClipboardCopy = Extension.create<ClipboardCopyOptions>({
  name: 'clipboardCopy',

  addOptions() {
    return { getCopyFormat: () => 'html' as CopyFormat }
  },

  addProseMirrorPlugins() {
    const schema = this.editor.schema
    const serializer = createClipboardSerializer(schema)
    const { getCopyFormat } = this.options

    return [
      new Plugin({
        key: new PluginKey('clipboardCopy'),
        // handleCopy/handleCut are valid ProseMirror EditorProps but
        // @tiptap/pm re-exports narrowed types that omit them. Cast to
        // satisfy TS while keeping runtime correctness.
         
        props: {
          handleCopy(view: EditorView, event: Event) {
            return handleClipboard(getCopyFormat, serializer)(view, event as ClipboardEvent)
          },
          handleCut(view: EditorView, event: Event) {
            const handled = handleClipboard(getCopyFormat, serializer)(view, event as ClipboardEvent)
            if (handled) {
              view.dispatch(view.state.tr.deleteSelection().scrollIntoView())
            }
            return handled
          },
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      }),
    ]
  },
})
