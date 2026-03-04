import { describe, expect, it } from 'vitest'
import { extractText } from '~/utils/extractText'

describe('extractText', () => {
  it('extracts text from a simple document', () => {
    const content = {
      type: 'doc' as const,
      content: [
        {
          type: 'paragraph' as const,
          content: [{ type: 'text' as const, text: 'Hello world' }],
        },
      ],
    }
    expect(extractText(content)).toBe('Hello world')
  })

  it('extracts text from nested nodes', () => {
    const content = {
      type: 'doc' as const,
      content: [
        {
          type: 'heading' as const,
          content: [{ type: 'text' as const, text: 'Title' }],
        },
        {
          type: 'paragraph' as const,
          content: [{ type: 'text' as const, text: 'Body text' }],
        },
      ],
    }
    expect(extractText(content)).toBe('Title Body text')
  })

  it('truncates long text', () => {
    const content = {
      type: 'doc' as const,
      content: [
        {
          type: 'paragraph' as const,
          content: [{ type: 'text' as const, text: 'A'.repeat(200) }],
        },
      ],
    }
    const result = extractText(content, 50)
    expect(result.length).toBeLessThanOrEqual(54) // 50 + '...'
    expect(result).toContain('...')
  })

  it('returns empty string for empty doc', () => {
    const content = { type: 'doc' as const, content: [] }
    expect(extractText(content)).toBe('')
  })

  it('skips first heading when skipFirstHeading is true', () => {
    const content = {
      type: 'doc' as const,
      content: [
        {
          type: 'heading' as const,
          content: [{ type: 'text' as const, text: 'Title' }],
        },
        {
          type: 'paragraph' as const,
          content: [{ type: 'text' as const, text: 'Body text' }],
        },
      ],
    }
    expect(extractText(content, 120, { skipFirstHeading: true })).toBe('Body text')
  })

  it('only skips the first heading, not subsequent ones', () => {
    const content = {
      type: 'doc' as const,
      content: [
        {
          type: 'heading' as const,
          content: [{ type: 'text' as const, text: 'Title' }],
        },
        {
          type: 'heading' as const,
          content: [{ type: 'text' as const, text: 'Subtitle' }],
        },
        {
          type: 'paragraph' as const,
          content: [{ type: 'text' as const, text: 'Body' }],
        },
      ],
    }
    expect(extractText(content, 120, { skipFirstHeading: true })).toBe('Subtitle Body')
  })
})
