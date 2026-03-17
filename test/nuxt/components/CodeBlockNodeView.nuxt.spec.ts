import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import NoteEditor from '~/components/NoteEditor.vue'
import { _resetLocalStorage } from '~/composables/useLocalStorage'

vi.mock('@tiptap/extension-table/kit', () => ({
  TableKit: { configure: () => ({}) },
}))
vi.mock('@tiptap/extension-task-list', () => ({
  TaskList: {},
}))
vi.mock('@tiptap/extension-task-item', () => ({
  TaskItem: { configure: () => ({}) },
}))
vi.mock('@tiptap/vue-3', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tiptap/vue-3')>()
  return {
    ...actual,
    Extension: {
      create: () => ({}),
    },
  }
})
vi.mock('@tiptap/markdown', () => ({
  Markdown: { configure: () => ({}) },
}))

const STORAGE_KEY = 'note.box:notes'

function seedCodeNote() {
  const note = {
    id: 'code-note',
    slug: 'code-note',
    title: 'Code Test',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Code Test' }] },
        { type: 'codeBlock', attrs: { language: 'js' }, content: [{ type: 'text', text: 'const x = 1' }] },
      ],
    },
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify([note]))
  return note
}

describe('CodeBlockNodeView', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    _resetLocalStorage()
    localStorage.clear()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('renders the editor with a code block note', async () => {
    seedCodeNote()
    const component = await mountSuspended(NoteEditor, {
      props: { noteSlug: 'code-note' },
      global: {
        stubs: {
          UEditorToolbar: true,
          UEditorSuggestionMenu: true,
          UEditorDragHandle: true,
          MobileFormattingBar: true,
          CodeBlockLanguagePicker: true,
        },
      },
    })
    expect(component.find('.zen-editor').exists()).toBe(true)
  })
})
