import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useNotes } from '~/composables/useNotes'
import { _resetLocalStorage } from '~/composables/useLocalStorage'

describe('useNotes', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-05T12:00:00.000Z'))
    _resetLocalStorage()
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with empty notes', () => {
    const { notes } = useNotes()
    expect(notes.value).toEqual([])
  })

  it('creates a new note with H1 and paragraph', () => {
    const { notes, create } = useNotes()
    const note = create()
    expect(note.id).toBeTruthy()
    expect(note.slug).toBe('untitled-2026-03-05')
    expect(note.title).toBe('')
    expect(note.content.type).toBe('doc')
    expect(note.content.content).toEqual([
      { type: 'heading', attrs: { level: 1 } },
      { type: 'paragraph' },
    ])
    expect(note.createdAt).toBeTruthy()
    expect(note.updatedAt).toBeTruthy()
    expect(notes.value).toHaveLength(1)
  })

  it('generates unique slugs for multiple untitled notes', () => {
    const { create } = useNotes()
    const note1 = create()
    const note2 = create()
    const note3 = create()
    expect(note1.slug).toBe('untitled-2026-03-05')
    expect(note2.slug).toBe('untitled-2026-03-05-2')
    expect(note3.slug).toBe('untitled-2026-03-05-3')
  })

  it('shares state across multiple useNotes() calls', () => {
    const { create } = useNotes()
    const { notes: notesFromOtherCall } = useNotes()

    create()

    expect(notesFromOtherCall.value).toHaveLength(1)
  })

  it('gets a note by id', () => {
    const { create, get } = useNotes()
    const note = create()
    expect(get(note.id)).toEqual(note)
  })

  it('gets a note by slug', () => {
    const { create, getBySlug } = useNotes()
    const note = create()
    expect(getBySlug(note.slug)).toEqual(note)
  })

  it('returns undefined for non-existent id', () => {
    const { get } = useNotes()
    expect(get('non-existent')).toBeUndefined()
  })

  it('returns undefined for non-existent slug', () => {
    const { getBySlug } = useNotes()
    expect(getBySlug('non-existent')).toBeUndefined()
  })

  it('removes a note', () => {
    const { notes, create, remove } = useNotes()
    const note = create()
    remove(note.id)
    expect(notes.value).toHaveLength(0)
  })

  it('updates a note and regenerates slug on title change', () => {
    const { create, get, update } = useNotes()
    const note = create()
    const originalUpdatedAt = note.updatedAt

    vi.advanceTimersByTime(100)

    const newSlug = update(note.id, { title: 'New Title' })
    const updated = get(note.id)!
    expect(updated.title).toBe('New Title')
    expect(updated.slug).toBe('new-title')
    expect(newSlug).toBe('new-title')
    expect(updated.updatedAt).not.toBe(originalUpdatedAt)
  })

  it('does not regenerate slug when only content changes', () => {
    const { create, get, update } = useNotes()
    const note = create()
    const originalSlug = note.slug

    vi.advanceTimersByTime(100)

    const newSlug = update(note.id, { content: { type: 'doc', content: [] } })
    const updated = get(note.id)!
    expect(updated.slug).toBe(originalSlug)
    expect(newSlug).toBeUndefined()
  })

  it('handles slug collisions on title update', () => {
    const { create, update } = useNotes()
    const note1 = create()
    const note2 = create()

    update(note1.id, { title: 'My Note' })
    const newSlug = update(note2.id, { title: 'My Note' })

    expect(note1.slug).toBe('my-note')
    expect(newSlug).toBe('my-note-2')
    expect(note2.slug).toBe('my-note-2')
  })

  it('does not collide with own slug on same-title update', () => {
    const { create, update } = useNotes()
    const note = create()

    update(note.id, { title: 'My Note' })
    // Update again with same title - should keep same slug
    const newSlug = update(note.id, { title: 'My Note' })
    expect(newSlug).toBeUndefined() // title didn't change
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
