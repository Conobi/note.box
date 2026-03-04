import JSZip from 'jszip'
import type { Note } from '~/types/note'

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'untitled'
}

export async function exportNotesAsZip(notes: Note[]): Promise<void> {
  const zip = new JSZip()
  const usedNames = new Set<string>()

  for (const note of notes) {
    let name = sanitizeFilename(note.title)
    if (usedNames.has(name)) {
      name = `${name}-${note.id.slice(0, 6)}`
    }
    usedNames.add(name)

    const markdown = jsonContentToMarkdown(note.content)
    zip.file(`${name}.md`, markdown)
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'note-box-export.zip'
  a.click()
  URL.revokeObjectURL(url)
}
