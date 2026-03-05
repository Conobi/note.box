import type { JSONContent } from '@tiptap/vue-3'

export function useNote(id: string) {
  const { get, update } = useNotes()

  const note = computed(() => get(id))

  let saveTimeout: ReturnType<typeof setTimeout> | null = null
  let pendingContent: JSONContent | null = null
  let pendingTitle: string | undefined

  function save(content: JSONContent, title?: string): void {
    pendingContent = content
    pendingTitle = title
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      const noteTitle = pendingTitle ?? extractTitle(content)
      const newSlug = update(id, { content, title: noteTitle })
      saveTimeout = null
      pendingContent = null
      pendingTitle = undefined
      if (newSlug) {
        onSlugChange?.(newSlug)
      }
    }, 300)
  }

  function flush(): void {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
      saveTimeout = null
      const n = note.value
      if (n && pendingContent) {
        const noteTitle = pendingTitle ?? extractTitle(pendingContent)
        const newSlug = update(id, { content: pendingContent, title: noteTitle })
        pendingContent = null
        pendingTitle = undefined
        if (newSlug) {
          onSlugChange?.(newSlug)
        }
      }
    }
  }

  let onSlugChange: ((slug: string) => void) | null = null

  function onSlugUpdate(callback: (slug: string) => void) {
    onSlugChange = callback
  }

  return {
    note,
    save,
    flush,
    onSlugUpdate,
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
  return ''
}
