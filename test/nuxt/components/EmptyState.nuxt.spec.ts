import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import EmptyState from '~/components/EmptyState.vue'

describe('EmptyState', () => {
  it('renders heading and description', async () => {
    const component = await mountSuspended(EmptyState)

    expect(component.find('h2').text()).toBe('No note selected')
    expect(component.text()).toContain('Select a note from the sidebar')
  })

  it('renders the icon', async () => {
    const component = await mountSuspended(EmptyState)
    const icon = component.findComponent({ name: 'UIcon' })

    expect(icon.exists()).toBe(true)
    expect(icon.props('name')).toBe('i-lucide-notebook-pen')
  })
})
