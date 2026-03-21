import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SettingsModal from '~/components/SettingsModal.vue'

describe('SettingsModal', () => {
  // Nuxt's getAppManifest schedules a timer that fires after teardown,
  // calling $fetch when it's no longer defined. Fake timers prevent the leak.
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

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
    expect(body).toContain('Language')
  })
})
