import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useNotes } from '~/composables/useNotes'

describe('useNotes', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with empty notes', () => {
    const { notes } = useNotes()
    expect(notes.value).toEqual([])
  })

  it('creates a new note', () => {
    const { notes, create } = useNotes()
    const note = create()
    expect(note.id).toBeTruthy()
    expect(note.title).toBe('Untitled')
    expect(note.content.type).toBe('doc')
    expect(note.createdAt).toBeTruthy()
    expect(note.updatedAt).toBeTruthy()
    expect(notes.value).toHaveLength(1)
  })

  it('gets a note by id', () => {
    const { create, get } = useNotes()
    const note = create()
    expect(get(note.id)).toEqual(note)
  })

  it('returns undefined for non-existent id', () => {
    const { get } = useNotes()
    expect(get('non-existent')).toBeUndefined()
  })

  it('removes a note', () => {
    const { notes, create, remove } = useNotes()
    const note = create()
    remove(note.id)
    expect(notes.value).toHaveLength(0)
  })

  it('updates a note', () => {
    const { create, get, update } = useNotes()
    const note = create()
    const originalUpdatedAt = note.updatedAt

    vi.advanceTimersByTime(100)

    update(note.id, { title: 'New Title' })
    const updated = get(note.id)!
    expect(updated.title).toBe('New Title')
    expect(updated.updatedAt).not.toBe(originalUpdatedAt)
  })

  it('sorts notes by updatedAt descending', () => {
    const { notes, create, update } = useNotes()
    const note1 = create()
    vi.advanceTimersByTime(100)
    const note2 = create()
    vi.advanceTimersByTime(100)

    // Update note1 to be more recent
    update(note1.id, { title: 'Updated first' })

    expect(notes.value[0].id).toBe(note1.id)
    expect(notes.value[1].id).toBe(note2.id)
  })

  it('searches notes by title', () => {
    const { create, update, search } = useNotes()
    const note1 = create()
    create()
    update(note1.id, { title: 'Meeting Notes' })

    const results = search('meeting')
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe(note1.id)
  })

  it('returns all sorted notes for empty search query', () => {
    const { create, search } = useNotes()
    create()
    create()
    expect(search('')).toHaveLength(2)
  })
})
