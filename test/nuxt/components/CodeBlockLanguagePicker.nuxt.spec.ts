import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import CodeBlockLanguagePicker from '~/components/CodeBlockLanguagePicker.vue'

describe('CodeBlockLanguagePicker', () => {
  it('renders the language label', async () => {
    const component = await mountSuspended(CodeBlockLanguagePicker, {
      props: { language: 'js' },
    })
    expect(component.text()).toContain('js')
  })

  it('shows "Plain text" when no language is set', async () => {
    const component = await mountSuspended(CodeBlockLanguagePicker, {
      props: { language: null },
    })
    expect(component.text()).toContain('Plain text')
  })
})
