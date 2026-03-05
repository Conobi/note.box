import JSZip from 'jszip'
import { describe, expect, it, vi } from 'vitest'
import type { Note } from '~/types/note'
import { exportNotesAsZip } from '~/utils/exportNotes'

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'abc123',
    slug: 'test-note',
    title: 'Test Note',
    content: {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }],
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('exportNotesAsZip', () => {
  it('creates a zip with .md files', async () => {
    let downloadedUrl = ''
    const createObjectURL = vi.fn((_blob: Blob) => {
      downloadedUrl = 'blob:test'
      return downloadedUrl
    })
    const revokeObjectURL = vi.fn()
    const click = vi.fn()
    const createElement = vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click,
    } as unknown as HTMLAnchorElement)

    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })

    const notes = [makeNote({ title: 'My Note' })]
    await exportNotesAsZip(notes)

    expect(click).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test')

    createElement.mockRestore()
    vi.unstubAllGlobals()
  })

  it('sanitizes filenames', async () => {
    const click = vi.fn()
    let capturedBlob: Blob | null = null
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click,
    } as unknown as HTMLAnchorElement)
    vi.stubGlobal('URL', {
      createObjectURL: (blob: Blob) => { capturedBlob = blob; return 'blob:test' },
      revokeObjectURL: vi.fn(),
    })

    const notes = [makeNote({ title: 'Hello <World> / "Test"' })]
    await exportNotesAsZip(notes)

    const zip = await JSZip.loadAsync(capturedBlob!)
    const files = Object.keys(zip.files)
    expect(files).toHaveLength(1)
    expect(files[0]).toBe('Hello-World-Test.md')

    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('handles empty notes array', async () => {
    const click = vi.fn()
    let capturedBlob: Blob | null = null
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click,
    } as unknown as HTMLAnchorElement)
    vi.stubGlobal('URL', {
      createObjectURL: (blob: Blob) => { capturedBlob = blob; return 'blob:test' },
      revokeObjectURL: vi.fn(),
    })

    await exportNotesAsZip([])

    const zip = await JSZip.loadAsync(capturedBlob!)
    expect(Object.keys(zip.files)).toHaveLength(0)

    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('deduplicates filenames', async () => {
    const click = vi.fn()
    let capturedBlob: Blob | null = null
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click,
    } as unknown as HTMLAnchorElement)
    vi.stubGlobal('URL', {
      createObjectURL: (blob: Blob) => { capturedBlob = blob; return 'blob:test' },
      revokeObjectURL: vi.fn(),
    })

    const notes = [
      makeNote({ id: 'aaa111', title: 'Same' }),
      makeNote({ id: 'bbb222', title: 'Same' }),
    ]
    await exportNotesAsZip(notes)

    const zip = await JSZip.loadAsync(capturedBlob!)
    const files = Object.keys(zip.files)
    expect(files).toHaveLength(2)
    expect(files).toContain('Same.md')
    expect(files).toContain('Same-bbb222.md')

    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })
})
