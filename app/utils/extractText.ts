import type { JSONContent } from '@tiptap/vue-3'

export function extractText(content: JSONContent, maxLength = 120, { skipFirstHeading = false } = {}): string {
  const parts: string[] = []
  let totalLength = 0
  let skippedFirst = false

  function walk(node: JSONContent): void {
    if (totalLength >= maxLength) return
    if (skipFirstHeading && !skippedFirst && node.type === 'heading') {
      skippedFirst = true
      return
    }
    if (node.text) {
      parts.push(node.text)
      totalLength += node.text.length + (parts.length > 1 ? 1 : 0)
    }
    if (node.content) {
      for (const child of node.content) {
        walk(child)
      }
    }
  }

  walk(content)
  const text = parts.join(' ').trim()
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
}
