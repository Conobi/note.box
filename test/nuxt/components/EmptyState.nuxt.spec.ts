import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { TooltipProvider } from 'reka-ui'
import EmptyState from '~/components/EmptyState.vue'

const EmptyStateWithProvider = defineComponent({
  setup() {
    return () => h(TooltipProvider, {}, () => h(EmptyState))
  },
})

describe('EmptyState', () => {
  it('renders heading and description', async () => {
    const component = await mountSuspended(EmptyStateWithProvider)

    expect(component.find('h2').text()).toBe('Start writing')
    expect(component.text()).toContain('Create a new note and let your thoughts flow')
  })

  it('renders the icon', async () => {
    const component = await mountSuspended(EmptyStateWithProvider)
    const icon = component.findComponent({ name: 'UIcon' })

    expect(icon.exists()).toBe(true)
    expect(icon.props('name')).toBe('i-lucide-pen-line')
  })
})
