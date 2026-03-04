import type { Note } from '~/types/note'

const STORAGE_KEY = 'note.box:notes'

export function useNotes() {
  const notes = useLocalStorage<Note[]>(STORAGE_KEY, [])

  const sortedNotes = computed(() =>
    [...notes.value].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
  )

  function create(): Note {
    const now = new Date().toISOString()
    const note: Note = {
      id: generateId(),
      title: 'Untitled',
      content: {
        type: 'doc',
        content: [{ type: 'heading', attrs: { level: 1 } }, { type: 'paragraph' }],
      },
      createdAt: now,
      updatedAt: now,
    }
    notes.value.push(note)
    return note
  }

  function get(id: string): Note | undefined {
    return notes.value.find(n => n.id === id)
  }

  function remove(id: string): void {
    const index = notes.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notes.value.splice(index, 1)
    }
  }

  function update(id: string, updates: Partial<Pick<Note, 'title' | 'content'>>): void {
    const note = get(id)
    if (note) {
      Object.assign(note, updates, { updatedAt: new Date().toISOString() })
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
    remove,
    update,
    search,
  }
}
