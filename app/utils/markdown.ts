import type { JSONContent } from '@tiptap/vue-3'

function applyMarks(text: string, marks?: JSONContent['marks']): string {
  if (!marks) return text
  let result = text
  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':
        result = `**${result}**`
        break
      case 'italic':
        result = `*${result}*`
        break
      case 'strike':
        result = `~~${result}~~`
        break
      case 'code':
        result = `\`${result}\``
        break
      case 'underline':
        result = `<u>${result}</u>`
        break
      case 'highlight':
        result = `==${result}==`
        break
      case 'link':
        result = `[${result}](${mark.attrs?.href ?? ''})`
        break
    }
  }
  return result
}

function inlineContent(node: JSONContent): string {
  if (!node.content) return ''
  return node.content.map((child) => {
    if (child.type === 'text') {
      return applyMarks(child.text ?? '', child.marks)
    }
    if (child.type === 'hardBreak') {
      return '\n'
    }
    return ''
  }).join('')
}

function convertNode(node: JSONContent, indent = ''): string {
  switch (node.type) {
    case 'heading': {
      const level = node.attrs?.level ?? 1
      const prefix = '#'.repeat(level)
      return `${prefix} ${inlineContent(node)}`
    }
    case 'paragraph':
      return `${indent}${inlineContent(node)}`
    case 'bulletList':
      return (node.content ?? []).map((item) => {
        const lines = (item.content ?? []).map((child, i) => {
          const converted = convertNode(child, '  ')
          return i === 0 ? `${indent}- ${converted.trimStart()}` : converted
        })
        return lines.join('\n')
      }).join('\n')
    case 'orderedList':
      return (node.content ?? []).map((item, index) => {
        const lines = (item.content ?? []).map((child, i) => {
          const converted = convertNode(child, '  ')
          return i === 0 ? `${indent}${index + 1}. ${converted.trimStart()}` : converted
        })
        return lines.join('\n')
      }).join('\n')
    case 'blockquote':
      return (node.content ?? []).map(child =>
        convertNode(child).split('\n').map(line => `${indent}> ${line}`).join('\n'),
      ).join('\n')
    case 'codeBlock': {
      const lang = node.attrs?.language ?? ''
      const code = inlineContent(node)
      return `${indent}\`\`\`${lang}\n${code}\n${indent}\`\`\``
    }
    case 'horizontalRule':
      return `${indent}---`
    case 'taskList':
      return (node.content ?? []).map((item) => {
        const checked = item.attrs?.checked ? 'x' : ' '
        const lines = (item.content ?? []).map((child, i) => {
          const converted = convertNode(child, '  ')
          return i === 0 ? `${indent}- [${checked}] ${converted.trimStart()}` : converted
        })
        return lines.join('\n')
      }).join('\n')
    case 'table': {
      const rows = node.content ?? []
      return rows.map((row, rowIndex) => {
        const cells = (row.content ?? []).map(cell =>
          (cell.content ?? []).map(child => inlineContent(child)).join(' '),
        )
        const line = `| ${cells.join(' | ')} |`
        if (rowIndex === 0) {
          const separator = `| ${cells.map(() => '---').join(' | ')} |`
          return `${line}\n${separator}`
        }
        return line
      }).join('\n')
    }
    default:
      return ''
  }
}

export function jsonContentToMarkdown(doc: JSONContent): string {
  if (!doc.content) return ''
  return doc.content.map(node => convertNode(node)).join('\n\n')
}
