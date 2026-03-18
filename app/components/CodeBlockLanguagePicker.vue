<script setup lang="ts">
import { filterLanguages } from '~/utils/languages'

defineProps<{
  language: string | null
}>()

const emit = defineEmits<{
  select: [language: string | null]
}>()

const open = ref(false)
const query = ref('')
const filteredLanguages = computed(() => filterLanguages(query.value))
const focusedIndex = ref(-1)
const listRef = ref<HTMLElement>()
const inputRef = ref<HTMLInputElement>()

// Total items: "Plain text" option + filtered languages
const totalItems = computed(() => filteredLanguages.value.length + 1)

function select(alias: string | null) {
  emit('select', alias)
  open.value = false
  query.value = ''
  focusedIndex.value = -1
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    focusedIndex.value = Math.min(focusedIndex.value + 1, totalItems.value - 1)
    scrollToFocused()
  }
  else if (event.key === 'ArrowUp') {
    event.preventDefault()
    focusedIndex.value = Math.max(focusedIndex.value - 1, 0)
    scrollToFocused()
  }
  else if (event.key === 'Enter' && focusedIndex.value >= 0) {
    event.preventDefault()
    if (focusedIndex.value === 0) {
      select(null)
    }
    else {
      const lang = filteredLanguages.value[focusedIndex.value - 1]
      if (lang) select(lang.alias)
    }
  }
}

function scrollToFocused() {
  nextTick(() => {
    const el = listRef.value?.querySelector('[data-focused="true"]')
    el?.scrollIntoView({ block: 'nearest' })
  })
}

watch(query, () => {
  focusedIndex.value = -1
})

watch(open, (isOpen) => {
  if (isOpen) {
    nextTick(() => inputRef.value?.focus())
  }
})
</script>

<template>
  <UPopover v-model:open="open" :content="{ align: 'start' }">
    <button
      class="language-label"
      type="button"
      @click.stop
    >
      {{ language || $t('editor.plainText') }}
    </button>

    <template #content>
      <div class="w-52" @keydown="onKeydown">
        <input
          ref="inputRef"
          v-model="query"
          type="text"
          :placeholder="$t('editor.searchLanguages')"
          class="w-full border-b border-(--ui-border) bg-transparent px-3 py-2 text-sm outline-none"
        >
        <div ref="listRef" class="max-h-48 overflow-y-auto">
          <button
            class="flex w-full items-center justify-between px-3 py-1.5 text-sm transition-colors"
            :class="focusedIndex === 0 ? 'bg-(--ui-bg-elevated)' : 'hover:bg-(--ui-bg-elevated)'"
            :data-focused="focusedIndex === 0"
            type="button"
            @click="select(null)"
            @mouseenter="focusedIndex = 0"
          >
            <span>{{ $t('editor.plainText') }}</span>
          </button>
          <button
            v-for="(lang, i) in filteredLanguages"
            :key="lang.alias"
            class="flex w-full items-center justify-between px-3 py-1.5 text-sm transition-colors"
            :class="focusedIndex === i + 1 ? 'bg-(--ui-bg-elevated)' : 'hover:bg-(--ui-bg-elevated)'"
            :data-focused="focusedIndex === i + 1"
            type="button"
            @click="select(lang.alias)"
            @mouseenter="focusedIndex = i + 1"
          >
            <span>{{ lang.name }}</span>
            <span class="text-xs text-(--ui-text-muted) font-mono">{{ lang.alias }}</span>
          </button>
        </div>
      </div>
    </template>
  </UPopover>
</template>
