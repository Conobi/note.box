import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it } from 'vitest'
import NoteEditor from '~/components/NoteEditor.vue'

describe('NoteEditor', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows EmptyState when note does not exist', async () => {
    const component = await mountSuspended(NoteEditor, {
      props: { noteId: 'nonexistent' },
    })

    expect(component.text()).toContain('No note selected')
    expect(component.text()).toContain('Select a note from the sidebar')
  })
})
