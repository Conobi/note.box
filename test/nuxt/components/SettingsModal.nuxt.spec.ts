import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import SettingsModal from '~/components/SettingsModal.vue'

describe('SettingsModal', () => {
  it('renders without errors', async () => {
    const component = await mountSuspended(SettingsModal, {
      props: { open: false },
    })

    expect(component.exists()).toBe(true)
  })

  it('renders the modal content when open', async () => {
    await mountSuspended(SettingsModal, {
      props: { open: true },
      attachTo: document.body,
    })

    // Modal teleports to body, so query from document
    const body = document.body.innerHTML
    expect(body).toContain('Settings')
    expect(body).toContain('Font')
    expect(body).toContain('Theme')
  })
})
