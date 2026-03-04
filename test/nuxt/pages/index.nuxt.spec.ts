import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import IndexPage from '~/pages/index.vue'

describe('index page', () => {
  it('renders the empty state', async () => {
    const component = await mountSuspended(IndexPage)

    expect(component.text()).toContain('No note selected')
    expect(component.text()).toContain('Select a note from the sidebar')
  })
})
