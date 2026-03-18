<script setup lang="ts">
import { NodeViewContent, NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'

const props = defineProps(nodeViewProps)

const language = computed(() => props.node.attrs.language as string | null)
const codeText = computed(() => props.node.textContent)

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
    </div>
  </NodeViewWrapper>
</template>
