import type { JSONContent } from '@tiptap/vue-3'

export function extractText(content: JSONContent, maxLength = 120): string {
  const parts: string[] = []

  function walk(node: JSONContent): void {
    if (parts.join(' ').length >= maxLength) return
    if (node.text) {
      parts.push(node.text)
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
