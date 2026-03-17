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

function select(alias: string | null) {
  emit('select', alias)
  open.value = false
  query.value = ''
}
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
      <div class="w-52">
        <input
          v-model="query"
          type="text"
          :placeholder="$t('editor.searchLanguages')"
          class="w-full border-b border-(--ui-border) bg-transparent px-3 py-2 text-sm outline-none"
        >
        <div class="max-h-48 overflow-y-auto">
          <button
            class="flex w-full items-center justify-between px-3 py-1.5 text-sm hover:bg-(--ui-bg-elevated) transition-colors"
            type="button"
            @click="select(null)"
          >
            <span>{{ $t('editor.plainText') }}</span>
          </button>
          <button
            v-for="lang in filteredLanguages"
            :key="lang.alias"
            class="flex w-full items-center justify-between px-3 py-1.5 text-sm hover:bg-(--ui-bg-elevated) transition-colors"
            type="button"
            @click="select(lang.alias)"
          >
            <span>{{ lang.name }}</span>
            <span class="text-xs text-(--ui-text-muted) font-mono">{{ lang.alias }}</span>
          </button>
        </div>
      </div>
    </template>
  </UPopover>
</template>
