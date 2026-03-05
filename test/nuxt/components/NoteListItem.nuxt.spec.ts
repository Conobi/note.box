import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { TooltipProvider } from 'reka-ui'
import NoteListItem from '~/components/NoteListItem.vue'
import type { Note } from '~/types/note'

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'test-id',
    slug: 'test-note',
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

function wrapWithTooltipProvider(note: Note, active: boolean) {
  return defineComponent({
    setup() {
      return () => h(TooltipProvider, {}, () =>
        h(NoteListItem, { note, active, onDelete: () => {} }),
      )
    },
  })
}

describe('NoteListItem', () => {
  it('renders note title', async () => {
    const note = makeNote()
    const component = await mountSuspended(wrapWithTooltipProvider(note, false))

    expect(component.text()).toContain('Test Note')
  })

  it('renders text preview from content', async () => {
    const note = makeNote()
    const component = await mountSuspended(wrapWithTooltipProvider(note, false))

    expect(component.text()).toContain('Some body text')
  })

  it('renders a date string', async () => {
    const note = makeNote()
    const component = await mountSuspended(wrapWithTooltipProvider(note, false))

    // The component formats updatedAt (2026-02-20) — just verify some date text is present
    const dateSpan = component.find('span')
    expect(dateSpan.text().length).toBeGreaterThan(0)
  })

  it('links to the note page', async () => {
    const note = makeNote({ id: 'abc-123', slug: 'my-test-note' })
    const component = await mountSuspended(wrapWithTooltipProvider(note, false))

    const noteListItem = component.findComponent({ name: 'NoteListItem' })
    const link = noteListItem.findComponent({ name: 'NuxtLink' })
    expect(link.props('to')).toBe('/notes/my-test-note')
  })

  it('applies active styling class', async () => {
    const note = makeNote()
    const component = await mountSuspended(wrapWithTooltipProvider(note, true))

    const link = component.find('a')
    expect(link.classes()).toContain('group-hover/sidebar:bg-elevated')
  })

  it('has a delete button', async () => {
    const note = makeNote({ id: 'del-me' })
    const component = await mountSuspended(wrapWithTooltipProvider(note, false))

    const deleteBtn = component.findComponent({ name: 'UButton' })
    expect(deleteBtn.exists()).toBe(true)
    expect(deleteBtn.props('icon')).toBe('i-lucide-trash-2')
  })

  it('emits delete event on button click', async () => {
    const note = makeNote({ id: 'del-me' })
    const component = await mountSuspended(wrapWithTooltipProvider(note, false))

    // Click the rendered button element directly (UButton renders a <button>)
    const button = component.find('button')
    await button.trigger('click')

    const noteListItem = component.findComponent({ name: 'NoteListItem' })
    expect(noteListItem.emitted('delete')).toEqual([['del-me']])
  })
})
