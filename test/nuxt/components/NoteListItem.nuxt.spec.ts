import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import NoteListItem from '~/components/NoteListItem.vue'
import type { Note } from '~/types/note'

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'test-id',
    title: 'Test Note',
    content: {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Some body text' }] }],
    },
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-02-20T14:30:00.000Z',
    ...overrides,
  }
}

describe('NoteListItem', () => {
  it('renders note title', async () => {
    const component = await mountSuspended(NoteListItem, {
      props: { note: makeNote(), active: false },
    })

    expect(component.text()).toContain('Test Note')
  })

  it('renders text preview from content', async () => {
    const component = await mountSuspended(NoteListItem, {
      props: { note: makeNote(), active: false },
    })

    expect(component.text()).toContain('Some body text')
  })

  it('renders a date string', async () => {
    const component = await mountSuspended(NoteListItem, {
      props: { note: makeNote(), active: false },
    })

    // The component formats updatedAt (2026-02-20) — just verify some date text is present
    const dateSpan = component.find('span')
    expect(dateSpan.text().length).toBeGreaterThan(0)
  })

  it('links to the note page', async () => {
    const component = await mountSuspended(NoteListItem, {
      props: { note: makeNote({ id: 'abc-123' }), active: false },
    })

    const link = component.findComponent({ name: 'NuxtLink' })
    expect(link.props('to')).toBe('/notes/abc-123')
  })

  it('applies active styling class', async () => {
    const component = await mountSuspended(NoteListItem, {
      props: { note: makeNote(), active: true },
    })

    const link = component.find('a')
    expect(link.classes()).toContain('bg-elevated')
  })

  it('has a delete button', async () => {
    const component = await mountSuspended(NoteListItem, {
      props: { note: makeNote({ id: 'del-me' }), active: false },
    })

    const deleteBtn = component.findComponent({ name: 'UButton' })
    expect(deleteBtn.exists()).toBe(true)
    expect(deleteBtn.props('icon')).toBe('i-lucide-trash-2')
  })

  it('emits delete event on button click', async () => {
    const component = await mountSuspended(NoteListItem, {
      props: { note: makeNote({ id: 'del-me' }), active: false },
    })

    // Click the rendered button element directly (UButton renders a <button>)
    const button = component.find('button')
    await button.trigger('click')
    expect(component.emitted('delete')).toEqual([['del-me']])
  })
})
