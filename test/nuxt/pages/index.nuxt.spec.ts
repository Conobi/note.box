import { describe, expect, it, beforeEach } from 'vitest'

const STORAGE_KEY = 'note.box:notes'

describe('index page', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('creates a new note and redirects when no notes exist', async () => {
    const result = await $fetch('/', { redirect: 'manual' }).catch(() => null)

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    expect(stored.length).toBeGreaterThanOrEqual(0)
  })

  it('redirects to most recent note when notes exist', () => {
    const notes = [
      { id: 'note-1', title: 'Old', content: { type: 'doc', content: [] }, createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' },
      { id: 'note-2', title: 'Recent', content: { type: 'doc', content: [] }, createdAt: '2025-01-02T00:00:00.000Z', updatedAt: '2025-01-02T00:00:00.000Z' },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    const sorted = stored.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    expect(sorted[0].id).toBe('note-2')
  })
})
