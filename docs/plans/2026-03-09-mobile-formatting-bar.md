# Mobile Formatting Bar — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the bubble formatting toolbar with a fixed bottom bar on touch devices to eliminate conflicts with the OS text-selection overlay.

**Architecture:** A new `MobileFormattingBar.vue` component is rendered inside `NoteEditor.vue` when `isTouchDevice()` is true. It sticks to the bottom of the screen, shifts up with the virtual keyboard via `visualViewport` events, and exposes a toggle to reveal secondary formatting items. The existing `UEditorToolbar layout="bubble"` is suppressed on touch devices with a `v-if`.

**Tech Stack:** Vue 3, Nuxt UI (`UButton`, `UDropdownMenu`), TipTap (`Editor` type + chain commands), `visualViewport` API, `@nuxtjs/i18n`, Vitest + `@nuxt/test-utils`.

---

### Task 1: Add `isTouchDevice` utility

**Files:**
- Modify: `app/utils/platform.ts`
- Create: `test/unit/platform.spec.ts`

**Step 1: Write the failing test**

Create `test/unit/platform.spec.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { isTouchDevice } from '~/utils/platform'

describe('isTouchDevice', () => {
  afterEach(() => vi.restoreAllMocks())

  it('returns true when maxTouchPoints > 0', () => {
    vi.spyOn(navigator, 'maxTouchPoints', 'get').mockReturnValue(5)
    expect(isTouchDevice()).toBe(true)
  })

  it('returns false when maxTouchPoints is 0', () => {
    vi.spyOn(navigator, 'maxTouchPoints', 'get').mockReturnValue(0)
    expect(isTouchDevice()).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
pnpm test test/unit/platform.spec.ts
```
Expected: FAIL — `isTouchDevice is not a function`.

**Step 3: Add the utility**

Append to `app/utils/platform.ts`:

```ts
export function isTouchDevice(): boolean {
  return typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm test test/unit/platform.spec.ts
```
Expected: PASS.

**Step 5: Commit**

```bash
git add app/utils/platform.ts test/unit/platform.spec.ts
git commit -m "feat: add isTouchDevice utility"
```

---

### Task 2: Add `editor.moreFormatting` i18n key

All 9 locale files need the new key. The key is used as the aria-label for the `···` toggle button.

**Files:**
- Modify: `app/locales/en.json`, `app/locales/fr.json`, `app/locales/es.json`, `app/locales/de.json`, `app/locales/pt.json`, `app/locales/zh.json`, `app/locales/ja.json`, `app/locales/ko.json`, `app/locales/ar.json`

**Step 1: Add the key to every locale file**

In each file, find the `"editor"` object and add `"moreFormatting"` alongside the other keys. Use these translations:

| Locale | Value |
|--------|-------|
| `en` | `"More formatting"` |
| `fr` | `"Plus de mise en forme"` |
| `es` | `"Más formato"` |
| `de` | `"Weitere Formatierung"` |
| `pt` | `"Mais formatação"` |
| `zh` | `"更多格式"` |
| `ja` | `"さらに書式設定"` |
| `ko` | `"추가 서식"` |
| `ar` | `"تنسيق إضافي"` |

**Step 2: Verify i18n coverage test still passes**

```bash
pnpm test test/unit/i18n-expansion.spec.ts
```
Expected: PASS (the expansion test will catch if a locale is missing the new key).

**Step 3: Commit**

```bash
git add app/locales/
git commit -m "feat(i18n): add editor.moreFormatting key"
```

---

### Task 3: Create `MobileFormattingBar.vue`

**Files:**
- Create: `app/components/MobileFormattingBar.vue`
- Create: `test/nuxt/components/MobileFormattingBar.nuxt.spec.ts`

**Step 1: Write failing tests**

Create `test/nuxt/components/MobileFormattingBar.nuxt.spec.ts`:

```ts
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, it, expect, vi, afterEach } from 'vitest'
import MobileFormattingBar from '~/components/MobileFormattingBar.vue'

// Minimal Editor stub with the methods MobileFormattingBar calls
function makeEditor(overrides: Record<string, unknown> = {}) {
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
  }
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
    const editor = { chain: () => chainResult, isActive: vi.fn().mockReturnValue(false), getAttributes: vi.fn().mockReturnValue({}) }
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
    const editor = { chain: () => chainResult, isActive: vi.fn().mockReturnValue(false), getAttributes: vi.fn().mockReturnValue({}) }
    const wrapper = await mountSuspended(MobileFormattingBar, {
      props: { editor },
      global: { stubs },
    })
    await wrapper.find('[data-testid="italic-btn"]').trigger('click')
    expect(chainResult.toggleItalic).toHaveBeenCalled()
    expect(chainResult.run).toHaveBeenCalled()
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
pnpm test test/nuxt/components/MobileFormattingBar.nuxt.spec.ts
```
Expected: FAIL — `MobileFormattingBar not found`.

**Step 3: Create `app/components/MobileFormattingBar.vue`**

```vue
<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'

const props = defineProps<{
  editor: Editor
}>()

const { t } = useI18n()

const showSecondary = ref(false)

const headingItems = computed(() => [[
  {
    label: t('editor.heading1'),
    icon: 'i-lucide-heading-1',
    onSelect: () => props.editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    label: t('editor.heading2'),
    icon: 'i-lucide-heading-2',
    onSelect: () => props.editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: t('editor.heading3'),
    icon: 'i-lucide-heading-3',
    onSelect: () => props.editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
]])

function setLink() {
  const previous = props.editor.getAttributes('link').href as string | undefined
  const url = window.prompt(t('editor.link'), previous ?? '')
  if (url === null) return
  if (url === '') {
    props.editor.chain().focus().unsetLink().run()
  }
  else {
    props.editor.chain().focus().setLink({ href: url }).run()
  }
}

// Shift the bar above the virtual keyboard
const barBottom = ref(0)

function onViewportResize() {
  if (!window.visualViewport) return
  barBottom.value = window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop
}

onMounted(() => {
  window.visualViewport?.addEventListener('resize', onViewportResize)
})

onBeforeUnmount(() => {
  window.visualViewport?.removeEventListener('resize', onViewportResize)
})
</script>

<template>
  <div class="mobile-bar" :style="{ bottom: `${barBottom}px` }">
    <div v-if="showSecondary" class="mobile-bar__secondary">
      <UButton
        icon="i-lucide-underline"
        :variant="editor.isActive('underline') ? 'solid' : 'ghost'"
        :aria-label="t('editor.underline')"
        data-testid="underline-btn"
        @click="editor.chain().focus().toggleUnderline().run()"
      />
      <UButton
        icon="i-lucide-strikethrough"
        :variant="editor.isActive('strike') ? 'solid' : 'ghost'"
        :aria-label="t('editor.strikethrough')"
        data-testid="strike-btn"
        @click="editor.chain().focus().toggleStrike().run()"
      />
      <UButton
        icon="i-lucide-code"
        :variant="editor.isActive('code') ? 'solid' : 'ghost'"
        :aria-label="t('editor.code')"
        data-testid="code-btn"
        @click="editor.chain().focus().toggleCode().run()"
      />
    </div>

    <div class="mobile-bar__primary">
      <UDropdownMenu :items="headingItems">
        <UButton
          icon="i-lucide-heading"
          :variant="editor.isActive('heading') ? 'solid' : 'ghost'"
          :aria-label="t('editor.headings')"
          data-testid="heading-btn"
        />
      </UDropdownMenu>

      <UButton
        icon="i-lucide-bold"
        :variant="editor.isActive('bold') ? 'solid' : 'ghost'"
        :aria-label="t('editor.bold')"
        data-testid="bold-btn"
        @click="editor.chain().focus().toggleBold().run()"
      />

      <UButton
        icon="i-lucide-italic"
        :variant="editor.isActive('italic') ? 'solid' : 'ghost'"
        :aria-label="t('editor.italic')"
        data-testid="italic-btn"
        @click="editor.chain().focus().toggleItalic().run()"
      />

      <UButton
        icon="i-lucide-link"
        :variant="editor.isActive('link') ? 'solid' : 'ghost'"
        :aria-label="t('editor.link')"
        data-testid="link-btn"
        @click="setLink"
      />

      <UButton
        icon="i-lucide-ellipsis"
        :variant="showSecondary ? 'solid' : 'ghost'"
        :aria-label="t('editor.moreFormatting')"
        data-testid="more-btn"
        @click="showSecondary = !showSecondary"
      />
    </div>
  </div>
</template>

<style scoped>
.mobile-bar {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 50;
  border-top: 1px solid var(--ui-border);
  background-color: var(--ui-bg);
}

.mobile-bar__primary,
.mobile-bar__secondary {
  display: flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  gap: 0.25rem;
}
</style>
```

**Step 4: Run tests to verify they pass**

```bash
pnpm test test/nuxt/components/MobileFormattingBar.nuxt.spec.ts
```
Expected: PASS.

**Step 5: Commit**

```bash
git add app/components/MobileFormattingBar.vue test/nuxt/components/MobileFormattingBar.nuxt.spec.ts
git commit -m "feat: add MobileFormattingBar component"
```

---

### Task 4: Wire `MobileFormattingBar` into `NoteEditor.vue`

**Files:**
- Modify: `app/components/NoteEditor.vue`
- Modify: `test/nuxt/components/NoteEditor.nuxt.spec.ts`

**Step 1: Update the NoteEditor tests first**

In `test/nuxt/components/NoteEditor.nuxt.spec.ts`:

1. Add `MobileFormattingBar` to the `editorStubs` object:
```ts
const editorStubs = {
  UEditorToolbar: true,
  UEditorSuggestionMenu: true,
  UEditorDragHandle: true,
  MobileFormattingBar: true,  // add this
}
```

2. Update the toolbar count test — on non-touch (test env has `maxTouchPoints = 0`), the bubble toolbar still renders, so count stays 2. Add a new test for the mobile bar:
```ts
it('does not render MobileFormattingBar on non-touch devices', async () => {
  seedNote()
  // happy-dom has navigator.maxTouchPoints === 0 by default
  const component = await mountSuspended(NoteEditor, {
    props: { noteSlug: 'test-note' },
    global: { stubs: editorStubs },
  })
  expect(component.findComponent({ name: 'MobileFormattingBar' }).exists()).toBe(false)
})

it('renders MobileFormattingBar on touch devices', async () => {
  seedNote()
  vi.spyOn(navigator, 'maxTouchPoints', 'get').mockReturnValue(5)
  const component = await mountSuspended(NoteEditor, {
    props: { noteSlug: 'test-note' },
    global: { stubs: editorStubs },
  })
  expect(component.findComponent({ name: 'MobileFormattingBar' }).exists()).toBe(true)
  vi.restoreAllMocks()
})

it('does not render text bubble toolbar on touch devices', async () => {
  seedNote()
  vi.spyOn(navigator, 'maxTouchPoints', 'get').mockReturnValue(5)
  const component = await mountSuspended(NoteEditor, {
    props: { noteSlug: 'test-note' },
    global: { stubs: editorStubs },
  })
  // On touch: only the table bubble toolbar remains (index 0 is suppressed)
  const toolbars = component.findAllComponents({ name: 'UEditorToolbar' })
  expect(toolbars).toHaveLength(1)
  vi.restoreAllMocks()
})
```

**Step 2: Run new tests to confirm they fail**

```bash
pnpm test test/nuxt/components/NoteEditor.nuxt.spec.ts
```
Expected: FAIL on the 3 new tests.

**Step 3: Update `NoteEditor.vue`**

Add a reactive `isTouch` computed and `keyboardVisible` ref. Modify the `<script setup>` — add after the `editorRef` declaration:

```ts
const isTouch = import.meta.client ? isTouchDevice() : false
const keyboardVisible = ref(false)
```

Inside the `if (import.meta.client)` block, extend the existing `onViewportResize` function:

```ts
function onViewportResize() {
  if (window.visualViewport) {
    keyboardVisible.value = window.visualViewport.height < window.innerHeight * 0.75
  }
  document.activeElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}
```

In the `<template>`, make these two changes:

1. Add `v-if="!isTouch"` to the first `UEditorToolbar` (text formatting bubble):
```vue
<UEditorToolbar v-if="!isTouch" :editor="editor" :items="toolbarItems" layout="bubble" />
```

2. Add `MobileFormattingBar` after the closing `</UEditor>` tag, still inside the `<div class="zen-editor">`:
```vue
<MobileFormattingBar
  v-if="isTouch && keyboardVisible && editorRef"
  :editor="editorRef"
/>
```

**Step 4: Run the full NoteEditor test suite**

```bash
pnpm test test/nuxt/components/NoteEditor.nuxt.spec.ts
```
Expected: all tests PASS.

**Step 5: Commit**

```bash
git add app/components/NoteEditor.vue test/nuxt/components/NoteEditor.nuxt.spec.ts
git commit -m "feat: show MobileFormattingBar on touch, suppress bubble toolbar"
```

---

### Task 5: Final verification

**Step 1: Run the full test suite**

```bash
pnpm test
```
Expected: all tests PASS.

**Step 2: Lint and typecheck**

```bash
pnpm lint:fix && pnpm typecheck
```
Expected: no errors.

**Step 3: Fix any issues found, then commit if needed**

```bash
git add -p
git commit -m "fix: lint/typecheck issues in mobile formatting bar"
```

**Step 4: Manual smoke test on mobile**

Open the app on an Android device (or Chrome DevTools mobile emulation):
1. Navigate to a note
2. Tap the editor — keyboard appears, bottom bar slides up with it
3. Verify: Headings picker, Bold, Italic, Link, ··· are visible
4. Tap `···` — Underline, Strikethrough, Code appear above the primary row
5. Tap `···` again — secondary row hides
6. Select text — OS toolbar appears; verify it does NOT overlap the bottom bar
7. Tap a formatting button — active state changes (solid variant)

---

### Summary of files changed

| Action | Path |
|--------|------|
| Modify | `app/utils/platform.ts` |
| Create | `test/unit/platform.spec.ts` |
| Modify | `app/locales/en.json` (+ 8 other locale files) |
| Create | `app/components/MobileFormattingBar.vue` |
| Create | `test/nuxt/components/MobileFormattingBar.nuxt.spec.ts` |
| Modify | `app/components/NoteEditor.vue` |
| Modify | `test/nuxt/components/NoteEditor.nuxt.spec.ts` |
