import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ColorModeToggle from '~/components/ColorModeToggle.vue'

describe('ColorModeToggle', () => {
  it('renders a UButton with correct props', async () => {
    const component = await mountSuspended(ColorModeToggle)
    const button = component.findComponent({ name: 'UButton' })

    expect(button.exists()).toBe(true)
    expect(button.props('variant')).toBe('ghost')
    expect(button.props('size')).toBe('xs')
    expect(button.props('color')).toBe('neutral')
  })

  it('renders with a color mode icon', async () => {
    const component = await mountSuspended(ColorModeToggle)
    const button = component.findComponent({ name: 'UButton' })

    const icon = button.props('icon') as string
    expect(['i-lucide-moon', 'i-lucide-sun']).toContain(icon)
  })
})
