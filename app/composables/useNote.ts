import type { JSONContent } from '@tiptap/vue-3'

export function useNote(id: string) {
  const { get, update } = useNotes()

  const note = computed(() => get(id))

  let saveTimeout: ReturnType<typeof setTimeout> | null = null

  function save(content: JSONContent, title?: string): void {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      const noteTitle = title ?? extractTitle(content)
      update(id, { content, title: noteTitle })
      saveTimeout = null
    }, 300)
  }

  function flush(): void {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
      saveTimeout = null
      const n = note.value
      if (n) {
        update(id, { content: n.content, title: n.title })
      }
    }
  }

  return {
    note,
    save,
    flush,
  }
}

function extractTitle(content: JSONContent): string {
  if (content.content) {
    for (const node of content.content) {
      if (node.type === 'heading' && node.attrs?.level === 1 && node.content) {
        const text = node.content.map(n => n.text || '').join('')
        if (text.trim()) return text.trim()
      }
    }
  }
  return 'Untitled'
}
