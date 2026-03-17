import { describe, expect, it } from 'vitest'
import { LANGUAGES, filterLanguages } from '~/utils/languages'

describe('LANGUAGES', () => {
  it('is a non-empty array of { name, alias } objects', () => {
    expect(LANGUAGES.length).toBeGreaterThan(20)
    for (const lang of LANGUAGES) {
      expect(lang).toHaveProperty('name')
      expect(lang).toHaveProperty('alias')
      expect(typeof lang.name).toBe('string')
      expect(typeof lang.alias).toBe('string')
    }
  })

  it('includes common languages', () => {
    const aliases = LANGUAGES.map(l => l.alias)
    expect(aliases).toContain('js')
    expect(aliases).toContain('ts')
    expect(aliases).toContain('py')
    expect(aliases).toContain('rust')
    expect(aliases).toContain('go')
  })

  it('has no duplicate aliases', () => {
    const aliases = LANGUAGES.map(l => l.alias)
    expect(new Set(aliases).size).toBe(aliases.length)
  })
})

describe('filterLanguages', () => {
  it('returns all languages for empty query', () => {
    expect(filterLanguages('')).toEqual(LANGUAGES)
  })

  it('matches name substring (case-insensitive)', () => {
    const results = filterLanguages('java')
    const aliases = results.map(l => l.alias)
    // "java" matches both Java (name) and JavaScript (name contains "java")
    expect(aliases).toContain('java')
    expect(aliases).toContain('js')
  })

  it('filters by alias', () => {
    const results = filterLanguages('py')
    expect(results[0]!.alias).toBe('py')
  })

  it('returns empty array for no match', () => {
    expect(filterLanguages('zzzznotreal')).toEqual([])
  })
})
