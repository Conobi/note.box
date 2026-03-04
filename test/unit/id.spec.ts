import { describe, expect, it } from 'vitest'
import { generateId } from '~/utils/id'

describe('generateId', () => {
  it('returns a valid UUID', () => {
    const id = generateId()
    expect(id).toMatch(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/)
  })

  it('returns unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })
})
