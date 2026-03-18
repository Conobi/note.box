import { describe, expect, it } from 'vitest'
import {
  serializeCodeBlock,
  serializeTableCell,
  serializeTaskItem,
  serializeTaskList,
  escapeHtml,
} from '~/extensions/ClipboardCopy'
import { jsonContentToMarkdown } from '~/utils/markdown'

// Minimal mock for ProseMirror node shape used by serializers
function mockNode(typeName: string, attrs: Record<string, unknown> = {}, children?: { type: { name: string } }[]) {
  const node = {
    type: { name: typeName },
    attrs,
    forEach: (cb: (child: { type: { name: string } }) => void) => {
      children?.forEach(cb)
    },
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return node as any
}

describe('serializeCodeBlock', () => {
  it('produces <pre><code class="language-X"> with language', () => {
    const node = mockNode('codeBlock', { language: 'javascript' })
    const result = serializeCodeBlock(node)
    expect(result).toEqual(['pre', ['code', { class: 'language-javascript' }, 0]])
  })

  it('produces <pre><code> without class when no language', () => {
    const node = mockNode('codeBlock', { language: '' })
    const result = serializeCodeBlock(node)
    expect(result).toEqual(['pre', ['code', {}, 0]])
  })

  it('produces <pre><code> without class when language is null', () => {
    const node = mockNode('codeBlock', { language: null })
    const result = serializeCodeBlock(node)
    expect(result).toEqual(['pre', ['code', {}, 0]])
  })
})

describe('serializeTableCell', () => {
  it('produces <th> for tableHeader nodes', () => {
    const node = mockNode('tableHeader', {})
    const result = serializeTableCell(node)
    expect(result).toEqual(['th', { style: 'border:1px solid #ccc;padding:6px 12px' }, 0])
  })

  it('produces <td> for tableCell nodes', () => {
    const node = mockNode('tableCell', {})
    const result = serializeTableCell(node)
    expect(result).toEqual(['td', { style: 'border:1px solid #ccc;padding:6px 12px' }, 0])
  })

  it('includes colspan when > 1', () => {
    const node = mockNode('tableHeader', { colspan: 2, rowspan: 1 })
    const result = serializeTableCell(node)
    expect(result).toEqual(['th', { style: 'border:1px solid #ccc;padding:6px 12px', colspan: '2' }, 0])
  })

  it('includes rowspan when > 1', () => {
    const node = mockNode('tableCell', { colspan: 1, rowspan: 3 })
    const result = serializeTableCell(node)
    expect(result).toEqual(['td', { style: 'border:1px solid #ccc;padding:6px 12px', rowspan: '3' }, 0])
  })

  it('includes both colspan and rowspan', () => {
    const node = mockNode('tableCell', { colspan: 2, rowspan: 2 })
    const result = serializeTableCell(node)
    expect(result).toEqual(['td', { style: 'border:1px solid #ccc;padding:6px 12px', colspan: '2', rowspan: '2' }, 0])
  })
})

describe('serializeTaskItem', () => {
  it('produces checked checkbox when checked', () => {
    const node = mockNode('taskItem', { checked: true })
    const result = serializeTaskItem(node)
    expect(result).toEqual(['li', ['input', { type: 'checkbox', checked: '', disabled: '' }], 0])
  })

  it('produces unchecked checkbox when not checked', () => {
    const node = mockNode('taskItem', { checked: false })
    const result = serializeTaskItem(node)
    expect(result).toEqual(['li', ['input', { type: 'checkbox', disabled: '' }], 0])
  })
})

describe('serializeTaskList', () => {
  it('produces ul with no list-style', () => {
    const result = serializeTaskList()
    expect(result).toEqual(['ul', { style: 'list-style:none;padding-left:0' }, 0])
  })
})

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml('<script>"alert"&</script>')).toBe('&lt;script&gt;&quot;alert&quot;&amp;&lt;/script&gt;')
  })

  it('returns empty string unchanged', () => {
    expect(escapeHtml('')).toBe('')
  })
})

describe('sliceToMarkdown (via jsonContentToMarkdown)', () => {
  it('converts a doc fragment with mixed content to Markdown', () => {
    const json = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Title' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Some text' }] },
        { type: 'codeBlock', attrs: { language: 'ts' }, content: [{ type: 'text', text: 'const x = 1' }] },
      ],
    }
    expect(jsonContentToMarkdown(json)).toBe('## Title\n\nSome text\n\n```ts\nconst x = 1\n```')
  })

  it('handles empty content array', () => {
    expect(jsonContentToMarkdown({ type: 'doc', content: [] })).toBe('')
  })
})
