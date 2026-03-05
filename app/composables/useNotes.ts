import type { Note } from '~/types/note'

const STORAGE_KEY = 'note.box:notes'

export function useNotes() {
  const notes = useLocalStorage<Note[]>(STORAGE_KEY, [])

  const sortedNotes = computed(() =>
    [...notes.value].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
  )

  function generateUniqueSlug(title: string, excludeId?: string): string {
    const baseSlug = title === 'Untitled'
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
    const slug = generateUniqueSlug('Untitled')
    const note: Note = {
      id: generateId(),
      slug,
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

  function getBySlug(slug: string): Note | undefined {
    return notes.value.find(n => n.slug === slug)
  }

  function remove(id: string): void {
    const index = notes.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notes.value.splice(index, 1)
    }
  }

  function update(id: string, updates: Partial<Pick<Note, 'title' | 'content'>>): string | undefined {
    const note = get(id)
    if (note) {
      const titleChanged = updates.title !== undefined && updates.title !== note.title
      let newSlug: string | undefined

      if (titleChanged) {
        newSlug = generateUniqueSlug(updates.title!, id)
        Object.assign(note, updates, { slug: newSlug, updatedAt: new Date().toISOString() })
      }
      else {
        Object.assign(note, updates, { updatedAt: new Date().toISOString() })
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
