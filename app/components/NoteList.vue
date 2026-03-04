<script setup lang="ts">
const router = useRouter()
const route = useRoute()

const { notes, remove, search } = useNotes()

const searchQuery = ref('')

const filteredNotes = computed(() => search(searchQuery.value))

const activeNoteId = computed(() => route.params.id as string | undefined)

function deleteNote(id: string) {
  remove(id)
  if (activeNoteId.value === id) {
    const remaining = notes.value
    if (remaining.length > 0) {
      router.push(`/notes/${remaining[0]!.id}`)
    }
    else {
      router.push('/')
    }
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="grid grid-rows-[0fr] group-hover/sidebar:grid-rows-[1fr] transition-[grid-template-rows] duration-300">
      <div class="overflow-hidden">
        <div class="px-3 pb-2">
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Search notes..."
            size="sm"
          />
        </div>
      </div>
    </div>
    <div class="flex-1 overflow-y-auto px-2 pb-2">
      <div v-if="filteredNotes.length === 0" class="p-4 text-center text-sm text-dimmed group-hover/sidebar:text-muted transition-colors duration-300">
        {{ searchQuery ? 'No matching notes' : 'No notes yet' }}
      </div>
      <div v-else class="space-y-0.5">
        <div v-for="note in filteredNotes" :key="note.id" class="group/item">
          <NoteListItem
            :note="note"
            :active="note.id === activeNoteId"
            @delete="deleteNote"
          />
        </div>
      </div>
    </div>
  </div>
</template>
