import type { JSONContent } from '@tiptap/vue-3'

export interface Note {
  id: string
  slug: string
  title: string
  content: JSONContent
  createdAt: string
  updatedAt: string
}
