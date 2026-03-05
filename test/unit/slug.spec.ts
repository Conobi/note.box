import { describe, expect, it } from 'vitest'
import { slugify } from '~/utils/slug'

describe('slugify', () => {
  it('converts text to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('replaces spaces with hyphens', () => {
    expect(slugify('my note title')).toBe('my-note-title')
  })

  it('removes special characters', () => {
    expect(slugify('hello@world#2024!')).toBe('hello-world-2024')
  })

  it('removes diacritics', () => {
    expect(slugify('cafe resume naive')).toBe('cafe-resume-naive')
    expect(slugify('uber')).toBe('uber')
  })

  it('handles accented characters', () => {
    expect(slugify('resume')).toBe('resume')
  })

  it('collapses multiple hyphens', () => {
    expect(slugify('hello---world')).toBe('hello-world')
  })

  it('trims leading and trailing hyphens', () => {
    expect(slugify('--hello--')).toBe('hello')
    expect(slugify('  hello  ')).toBe('hello')
  })

  it('limits length to 80 characters', () => {
    const longText = 'a'.repeat(100)
    expect(slugify(longText).length).toBeLessThanOrEqual(80)
  })

  it('returns "untitled" for empty string', () => {
    expect(slugify('')).toBe('untitled')
  })

  it('returns "untitled" for string with only special characters', () => {
    expect(slugify('!!!@@@###')).toBe('untitled')
  })

  it('handles numbers', () => {
    expect(slugify('Chapter 1: Introduction')).toBe('chapter-1-introduction')
  })

  it('handles mixed content', () => {
    expect(slugify('My Notes (2024) - Draft #1')).toBe('my-notes-2024-draft-1')
  })

  it('handles unicode characters beyond basic diacritics', () => {
    expect(slugify('hello world')).toBe('hello-world')
  })

  it('handles consecutive special characters', () => {
    expect(slugify('a...b___c')).toBe('a-b-c')
  })
})
