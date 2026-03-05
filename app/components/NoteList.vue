<script setup lang="ts">
const props = withDefaults(defineProps<{
  alwaysExpanded?: boolean
}>(), { alwaysExpanded: false })

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const { notes, remove, search } = useNotes()

const searchQuery = ref('')
const searchWrapperRef = ref<HTMLElement | null>(null)
const forceExpanded = ref(false)

const filteredNotes = computed(() => search(searchQuery.value))

defineExpose({
  focusSearch() {
    forceExpanded.value = true
    nextTick(() => {
      searchWrapperRef.value?.querySelector('input')?.focus()
    })
  },
})

const activeSlug = computed(() => route.params.slug as string | undefined)

provide('sidebarExpanded', props.alwaysExpanded)

function deleteNote(id: string) {
  const noteToDelete = notes.value.find(n => n.id === id)
  remove(id)
  if (noteToDelete && activeSlug.value === noteToDelete.slug) {
    const remaining = notes.value
    if (remaining.length > 0) {
      router.push(`/notes/${remaining[0]!.slug}`)
    }
    else {
      router.push('/')
    }
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div :class="['grid transition-[grid-template-rows] duration-300', (alwaysExpanded || forceExpanded) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr] group-hover/sidebar:grid-rows-[1fr]']">
      <div class="overflow-hidden">
        <div ref="searchWrapperRef" class="px-3 pb-2">
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            :placeholder="t('noteList.searchPlaceholder')"
            size="sm"
            @blur="forceExpanded = false"
          >
            <template v-if="!searchQuery" #trailing>
              <div class="flex items-center gap-0.5">
                <UKbd value="meta" size="sm" />
                <UKbd value="K" size="sm" />
              </div>
            </template>
          </UInput>
        </div>
      </div>
    </div>
    <div class="flex-1 overflow-y-auto px-2 pb-2">
      <div v-if="filteredNotes.length === 0" :class="['p-4 text-center text-sm transition-colors duration-300', alwaysExpanded ? 'text-muted' : 'text-dimmed group-hover/sidebar:text-muted']">
        {{ searchQuery ? t('noteList.noMatching') : t('noteList.noNotes') }}
      </div>
      <div v-else class="space-y-0.5">
        <div v-for="note in filteredNotes" :key="note.id" class="group/item">
          <NoteListItem
            :note="note"
            :active="note.slug === activeSlug"
            @delete="deleteNote"
          />
        </div>
      </div>
    </div>
  </div>
</template>
