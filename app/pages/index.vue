<script setup lang="ts">
const router = useRouter()
const { notes, create } = useNotes()

const target = notes.value.length > 0
  ? notes.value[0]!
  : create()

router.replace(`/notes/${target.id}`)
</script>
