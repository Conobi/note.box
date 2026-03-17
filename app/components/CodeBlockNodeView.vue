<script lang="ts">
// Module-level singleton — shared across all CodeBlockNodeView instances
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let highlighterPromise: Promise<any> | null = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getHighlighter(): Promise<any> {
  if (!highlighterPromise) {
    highlighterPromise = import('shiki/bundle/web').then(({ createHighlighter }) =>
      createHighlighter({ themes: ['github-light', 'github-dark'], langs: [] }),
    )
  }
  return highlighterPromise
}

// Exported for test isolation
export function _resetHighlighter() {
  highlighterPromise = null
}
</script>

<script setup lang="ts">
// eslint-disable-next-line import/first
import { NodeViewContent, NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'

const props = defineProps(nodeViewProps)

const language = computed(() => props.node.attrs.language as string | null)
const codeText = computed(() => props.node.textContent)

const highlightedHtml = ref<string | null>(null)
let highlightTimer: ReturnType<typeof setTimeout> | null = null

// True when the editor cursor is inside this code block
const isFocused = computed(() => {
  const pos = typeof props.getPos === 'function' ? props.getPos() : undefined
  if (typeof pos !== 'number') return false
  const { from, to } = props.editor.state.selection
  return from >= pos && to <= pos + props.node.nodeSize
})

async function highlight() {
  const lang = language.value
  const code = codeText.value
  if (!lang || !code) {
    highlightedHtml.value = null
    return
  }
  try {
    const h = await getHighlighter()
    const loadedLangs = h.getLoadedLanguages()
    if (!loadedLangs.includes(lang)) {
      await h.loadLanguage(lang)
    }
    highlightedHtml.value = h.codeToHtml(code, {
      lang,
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
    })
  }
  catch {
    highlightedHtml.value = null
  }
}

function debouncedHighlight() {
  if (highlightTimer) clearTimeout(highlightTimer)
  highlightTimer = setTimeout(highlight, 300)
}

watch([language, codeText], debouncedHighlight, { immediate: true })

const copied = ref(false)
let copyTimeout: ReturnType<typeof setTimeout> | null = null

function onLanguageSelect(alias: string | null) {
  props.updateAttributes({ language: alias })
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(codeText.value)
  }
  catch {
    // Fallback for non-secure contexts
    const textarea = document.createElement('textarea')
    textarea.value = codeText.value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
  copied.value = true
  if (copyTimeout) clearTimeout(copyTimeout)
  copyTimeout = setTimeout(() => { copied.value = false }, 2000)
}

onBeforeUnmount(() => {
  if (copyTimeout) clearTimeout(copyTimeout)
  if (highlightTimer) clearTimeout(highlightTimer)
})
</script>

<template>
  <NodeViewWrapper class="code-block-wrapper" as="div">
    <div class="code-block-header" contenteditable="false">
      <CodeBlockLanguagePicker
        :language="language"
        @select="onLanguageSelect"
      />
      <button
        class="copy-button"
        type="button"
        :aria-label="copied ? $t('editor.copied') : 'Copy'"
        @click="copyCode"
      >
        <UIcon :name="copied ? 'i-lucide-check' : 'i-lucide-copy'" class="size-3.5" />
      </button>
    </div>
    <div class="code-content">
      <pre><NodeViewContent as="code" /></pre>
      <!-- eslint-disable vue/no-v-html -->
      <div
        v-if="highlightedHtml"
        class="shiki-overlay"
        :class="{ 'opacity-0': isFocused }"
        aria-hidden="true"
        v-html="highlightedHtml"
      />
      <!-- eslint-enable vue/no-v-html -->
    </div>
  </NodeViewWrapper>
</template>
