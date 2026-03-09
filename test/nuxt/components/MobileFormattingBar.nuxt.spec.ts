import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, it, expect, vi, afterEach } from 'vitest'
import type { Editor } from '@tiptap/vue-3'
import MobileFormattingBar from '~/components/MobileFormattingBar.vue'

// Minimal Editor stub with the methods MobileFormattingBar calls
function makeEditor(overrides: Record<string, unknown> = {}): Editor {
  const chainResult = {
    focus: () => chainResult,
    toggleBold: () => chainResult,
    toggleItalic: () => chainResult,
    toggleUnderline: () => chainResult,
    toggleStrike: () => chainResult,
    toggleCode: () => chainResult,
    setLink: () => chainResult,
    unsetLink: () => chainResult,
    toggleHeading: () => chainResult,
    run: vi.fn(),
  }
  return {
    chain: () => chainResult,
    isActive: vi.fn().mockReturnValue(false),
    getAttributes: vi.fn().mockReturnValue({}),
    ...overrides,
  } as unknown as Editor
}

const stubs = {
  UDropdownMenu: { template: '<div><slot /></div>' },
  UButton: { template: '<button><slot /></button>', props: ['icon', 'variant', 'ariaLabel'] },
}

describe('MobileFormattingBar', () => {
  afterEach(() => vi.restoreAllMocks())

  it('renders the primary row', async () => {
    const editor = makeEditor()
    const wrapper = await mountSuspended(MobileFormattingBar, {
      props: { editor },
      global: { stubs },
    })
    expect(wrapper.find('.mobile-bar__primary').exists()).toBe(true)
  })

  it('hides the secondary row by default', async () => {
    const editor = makeEditor()
    const wrapper = await mountSuspended(MobileFormattingBar, {
      props: { editor },
      global: { stubs },
    })
    expect(wrapper.find('.mobile-bar__secondary').exists()).toBe(false)
  })

  it('shows secondary row after clicking the more button', async () => {
    const editor = makeEditor()
    const wrapper = await mountSuspended(MobileFormattingBar, {
      props: { editor },
      global: { stubs },
    })
    await wrapper.find('[data-testid="more-btn"]').trigger('click')
    expect(wrapper.find('.mobile-bar__secondary').exists()).toBe(true)
  })

  it('hides secondary row on second click of more button', async () => {
    const editor = makeEditor()
    const wrapper = await mountSuspended(MobileFormattingBar, {
      props: { editor },
      global: { stubs },
    })
    await wrapper.find('[data-testid="more-btn"]').trigger('click')
    await wrapper.find('[data-testid="more-btn"]').trigger('click')
    expect(wrapper.find('.mobile-bar__secondary').exists()).toBe(false)
  })

  it('calls toggleBold chain on bold button click', async () => {
    const chainResult = {
      focus: () => chainResult,
      toggleBold: vi.fn(() => chainResult),
      run: vi.fn(),
    }
    const editor = { chain: () => chainResult, isActive: vi.fn().mockReturnValue(false), getAttributes: vi.fn().mockReturnValue({}) } as unknown as Editor
    const wrapper = await mountSuspended(MobileFormattingBar, {
      props: { editor },
      global: { stubs },
    })
    await wrapper.find('[data-testid="bold-btn"]').trigger('click')
    expect(chainResult.toggleBold).toHaveBeenCalled()
    expect(chainResult.run).toHaveBeenCalled()
  })

  it('calls toggleItalic chain on italic button click', async () => {
    const chainResult = {
      focus: () => chainResult,
      toggleItalic: vi.fn(() => chainResult),
      run: vi.fn(),
    }
    const editor = { chain: () => chainResult, isActive: vi.fn().mockReturnValue(false), getAttributes: vi.fn().mockReturnValue({}) } as unknown as Editor
    const wrapper = await mountSuspended(MobileFormattingBar, {
      props: { editor },
      global: { stubs },
    })
    await wrapper.find('[data-testid="italic-btn"]').trigger('click')
    expect(chainResult.toggleItalic).toHaveBeenCalled()
    expect(chainResult.run).toHaveBeenCalled()
  })
})
