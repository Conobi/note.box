import type { Note } from '~/types/note'

const STORAGE_KEY = 'note.box:notes'

function markContentRaw(notes: Note[]): void {
  for (const note of notes) {
    if (note.content && !Object.isFrozen(note.content)) {
      markRaw(note.content)
    }
  }
}

export function useNotes() {
  const notes = useLocalStorage<Note[]>(STORAGE_KEY, [])

  // Mark existing content as raw on initial load
  markContentRaw(notes.value)

  // When the array reference is replaced (cross-tab sync), mark content raw
  // before other watchers see the data
  watch(notes, (newNotes) => {
    markContentRaw(newNotes)
  }, { flush: 'sync' })

  const sortedNotes = computed(() =>
    [...notes.value].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
  )

  function generateUniqueSlug(title: string, excludeId?: string): string {
    const baseSlug = !title
      ? `untitled-${new Date().toISOString().slice(0, 10)}`
      : slugify(title)

    const otherNotes = excludeId
      ? notes.value.filter(n => n.id !== excludeId)
      : notes.value

    const existingSlugs = new Set(otherNotes.map(n => n.slug))

    if (!existingSlugs.has(baseSlug)) return baseSlug

    let counter = 2
    while (existingSlugs.has(`${baseSlug}-${counter}`)) {
      counter++
    }
    return `${baseSlug}-${counter}`
  }

  function create(): Note {
    const now = new Date().toISOString()
    const slug = generateUniqueSlug('')
    const note: Note = {
      id: generateId(),
      slug,
      title: '',
      content: markRaw({
        type: 'doc',
        content: [{ type: 'heading', attrs: { level: 1 } }, { type: 'paragraph' }],
      }),
      createdAt: now,
      updatedAt: now,
    }
    notes.value.push(note)
    return note
  }

  function get(id: string): Note | undefined {
    return notes.value.find(n => n.id === id)
  }

  function getBySlug(slug: string): Note | undefined {
    return notes.value.find(n => n.slug === slug)
  }

  function remove(id: string): void {
    const index = notes.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notes.value.splice(index, 1)
    }
  }

  function update(id: string, updates: Partial<Pick<Note, 'title' | 'content'>>, options?: { skipTimestamp?: boolean }): string | undefined {
    const note = get(id)
    if (note) {
      const titleChanged = updates.title !== undefined && updates.title !== note.title
      let newSlug: string | undefined
      const skipTimestamp = options?.skipTimestamp ?? false

      // Assign content via toRaw to avoid triggering reactive cascades
      // (sortedNotes recompute, NoteListItem re-renders)
      if (updates.content) {
        toRaw(note).content = markRaw(updates.content)
      }

      if (titleChanged) {
        newSlug = generateUniqueSlug(updates.title!, id)
        const timestamp = skipTimestamp ? {} : { updatedAt: new Date().toISOString() }
        Object.assign(note, { title: updates.title, slug: newSlug, ...timestamp })
      }
      else if (!skipTimestamp) {
        Object.assign(note, { updatedAt: new Date().toISOString() })
      }

      // Content-only save with no reactive mutation: manually schedule persistence
      if (updates.content && !titleChanged && skipTimestamp) {
        _scheduleWrite(STORAGE_KEY)
      }

      return newSlug
    }
  }

  function search(query: string): Note[] {
    if (!query.trim()) return sortedNotes.value
    const q = query.toLowerCase()
    return sortedNotes.value.filter(note =>
      note.title.toLowerCase().includes(q),
    )
  }

  return {
    notes: sortedNotes,
    create,
    get,
    getBySlug,
    remove,
    update,
    search,
  }
}
