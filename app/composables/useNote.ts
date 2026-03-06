import type { JSONContent } from '@tiptap/vue-3'

export function useNote(id: string) {
  const { get, update } = useNotes()

  const note = computed(() => get(id))

  let saveTimeout: ReturnType<typeof setTimeout> | null = null
  let pendingGetContent: (() => JSONContent) | null = null
  let pendingTitle: string | undefined

  function save(getContent: () => JSONContent, title?: string): void {
    pendingGetContent = getContent
    pendingTitle = title
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      const content = pendingGetContent!()
      const noteTitle = pendingTitle ?? extractTitle(content)
      const newSlug = update(id, { content, title: noteTitle }, { skipTimestamp: true })
      saveTimeout = null
      pendingGetContent = null
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
      if (n && pendingGetContent) {
        const content = pendingGetContent()
        const noteTitle = pendingTitle ?? extractTitle(content)
        const newSlug = update(id, { content, title: noteTitle })
        pendingGetContent = null
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
