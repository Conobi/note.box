<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'

const props = defineProps<{
  editor: Editor
}>()

const { t } = useI18n()

type SecondaryPanel = 'headings' | 'formatting' | null
const secondaryPanel = ref<SecondaryPanel>(null)

function togglePanel(panel: 'headings' | 'formatting') {
  secondaryPanel.value = secondaryPanel.value === panel ? null : panel
}

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

const bottomOffset = ref(0)

function onViewportChange() {
  if (!window.visualViewport) return
  const vp = window.visualViewport
  bottomOffset.value = Math.max(0, window.innerHeight - (vp.offsetTop + vp.height))
}

onMounted(() => {
  onViewportChange()
  window.visualViewport?.addEventListener('resize', onViewportChange)
  window.visualViewport?.addEventListener('scroll', onViewportChange)
})

onBeforeUnmount(() => {
  window.visualViewport?.removeEventListener('resize', onViewportChange)
  window.visualViewport?.removeEventListener('scroll', onViewportChange)
})
</script>

<template>
  <div class="mobile-bar" :style="{ bottom: `${bottomOffset}px` }" @pointerdown.prevent>
    <div v-if="secondaryPanel === 'headings'" class="mobile-bar__secondary">
      <UButton
        icon="i-lucide-heading-1"
        :variant="editor.isActive('heading', { level: 1 }) ? 'solid' : 'ghost'"
        :aria-label="t('editor.heading1')"
        data-testid="heading1-btn"
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
      />
      <UButton
        icon="i-lucide-heading-2"
        :variant="editor.isActive('heading', { level: 2 }) ? 'solid' : 'ghost'"
        :aria-label="t('editor.heading2')"
        data-testid="heading2-btn"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
      />
      <UButton
        icon="i-lucide-heading-3"
        :variant="editor.isActive('heading', { level: 3 }) ? 'solid' : 'ghost'"
        :aria-label="t('editor.heading3')"
        data-testid="heading3-btn"
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
      />
    </div>

    <div v-if="secondaryPanel === 'formatting'" class="mobile-bar__secondary">
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
      <UButton
        icon="i-lucide-heading"
        :variant="secondaryPanel === 'headings' || editor.isActive('heading') ? 'solid' : 'ghost'"
        :aria-label="t('editor.headings')"
        data-testid="heading-btn"
        @click="togglePanel('headings')"
      />

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
        :variant="secondaryPanel === 'formatting' ? 'solid' : 'ghost'"
        :aria-label="t('editor.moreFormatting')"
        data-testid="more-btn"
        @click="togglePanel('formatting')"
      />
    </div>
  </div>
</template>

<style scoped>
.mobile-bar {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  border: 1px solid var(--ui-border);
  border-radius: var(--radius-xl);
  background-color: var(--ui-bg);
  box-shadow: var(--ui-shadow-md, 0 4px 16px rgb(0 0 0 / 0.12));
  margin-bottom: 0.5rem;
  width: max-content;
  max-width: calc(100vw - 2rem);
}

.mobile-bar__primary,
.mobile-bar__secondary {
  display: flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  gap: 0.25rem;
}
</style>
