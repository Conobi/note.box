import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it } from 'vitest'
import NoteList from '~/components/NoteList.vue'
import { _resetLocalStorage } from '~/composables/useLocalStorage'

describe('NoteList', () => {
  beforeEach(() => {
    _resetLocalStorage()
    localStorage.clear()
  })

  it('renders search input', async () => {
    const component = await mountSuspended(NoteList)

    const input = component.findComponent({ name: 'UInput' })
    expect(input.exists()).toBe(true)
    expect(input.props('placeholder')).toBe('Search notes...')
  })

  it('shows empty message when no notes exist', async () => {
    const component = await mountSuspended(NoteList)

    expect(component.text()).toContain('No notes yet')
  })

  it('renders note items after creating a note', async () => {
    localStorage.setItem('note.box:notes', JSON.stringify([{
      id: 'note-1',
      title: 'First Note',
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }]))

    const component = await mountSuspended(NoteList)

    expect(component.text()).toContain('First Note')
    expect(component.text()).not.toContain('No notes yet')
  })
})
