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
