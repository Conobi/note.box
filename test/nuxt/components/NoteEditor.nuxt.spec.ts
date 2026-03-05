import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import NoteEditor from '~/components/NoteEditor.vue'
import { _resetLocalStorage } from '~/composables/useLocalStorage'

const STORAGE_KEY = 'note.box:notes'

describe('NoteEditor', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    _resetLocalStorage()
    localStorage.clear()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('redirects when note does not exist', async () => {
    const component = await mountSuspended(NoteEditor, {
      props: { noteSlug: 'nonexistent' },
    })

    expect(component.find('.zen-editor').exists()).toBe(false)
  })

  it('renders the editor when note exists', async () => {
    const notes = [
      {
        id: 'test-note-id',
        slug: 'test-note',
        title: 'Test',
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))

    const component = await mountSuspended(NoteEditor, {
      props: { noteSlug: 'test-note' },
      global: {
        stubs: {
          UEditorToolbar: true,
          UEditorSuggestionMenu: true,
          UEditorDragHandle: true,
        },
      },
    })

    expect(component.find('.zen-editor').exists()).toBe(true)
  })
})
