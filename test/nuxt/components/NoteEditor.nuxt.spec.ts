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

const STORAGE_KEY = 'note.box:notes'

const editorStubs = {
  UEditorToolbar: true,
  UEditorSuggestionMenu: true,
  UEditorDragHandle: true,
}

function seedNote(overrides: Record<string, unknown> = {}) {
  const note = {
    id: 'test-note-id',
    slug: 'test-note',
    title: 'Test',
    content: { type: 'doc', content: [{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Test' }] }, { type: 'paragraph' }] },
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify([note]))
  return note
}

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
    seedNote()

    const component = await mountSuspended(NoteEditor, {
      props: { noteSlug: 'test-note' },
      global: { stubs: editorStubs },
    })

    expect(component.find('.zen-editor').exists()).toBe(true)
  })

  it('renders two editor toolbars (text + table)', async () => {
    seedNote()

    const component = await mountSuspended(NoteEditor, {
      props: { noteSlug: 'test-note' },
      global: { stubs: editorStubs },
    })

    const toolbars = component.findAllComponents({ name: 'UEditorToolbar' })
    expect(toolbars).toHaveLength(2)
  })

  it('updates URL via history.replaceState on slug change, not router.replace', async () => {
    seedNote({ title: '', slug: 'untitled' })

    const replaceStateSpy = vi.spyOn(window.history, 'replaceState')

    const component = await mountSuspended(NoteEditor, {
      props: { noteSlug: 'untitled' },
      global: { stubs: editorStubs },
    })

    // Simulate editor emitting updated content with a new title
    const newContent = {
      type: 'doc',
      content: [{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'My Note' }] }],
    }
    const editor = component.findComponent({ name: 'UEditor' })
    editor.vm.$emit('update:modelValue', newContent)

    // Advance past debounce
    vi.advanceTimersByTime(300)

    expect(replaceStateSpy).toHaveBeenCalledWith(
      expect.anything(),
      '',
      '/notes/my-note',
    )

    // Component should still be mounted (not destroyed by remount)
    expect(component.find('.zen-editor').exists()).toBe(true)

    replaceStateSpy.mockRestore()
  })

  it('passes initial content to UEditor, not reactive note content', async () => {
    const initialContent = {
      type: 'doc',
      content: [{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Original' }] }, { type: 'paragraph' }],
    }
    seedNote({ title: 'Original', content: initialContent })

    const component = await mountSuspended(NoteEditor, {
      props: { noteSlug: 'test-note' },
      global: { stubs: editorStubs },
    })

    const editor = component.findComponent({ name: 'UEditor' })
    const modelValueBefore = editor.props('modelValue')
    expect(modelValueBefore).toEqual(initialContent)

    // Simulate save with new content
    const newContent = {
      type: 'doc',
      content: [{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Updated' }] }],
    }
    editor.vm.$emit('update:modelValue', newContent)
    vi.advanceTimersByTime(300)
    await nextTick()

    // model-value should still be the initial content, not the updated one
    const modelValueAfter = editor.props('modelValue')
    expect(modelValueAfter).toEqual(initialContent)
  })
})
