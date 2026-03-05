import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null) {
      return flattenKeys(value as Record<string, unknown>, fullKey)
    }
    return [fullKey]
  })
}

describe('i18n locale files', () => {
  const localesDir = join(__dirname, '../../app/locales')
  const files = readdirSync(localesDir).filter(f => f.endsWith('.json'))

  const enContent = JSON.parse(readFileSync(join(localesDir, 'en.json'), 'utf-8'))
  const enKeys = flattenKeys(enContent).sort()

  const otherFiles = files.filter(f => f !== 'en.json')

  it('has en.json as canonical with keys', () => {
    expect(enKeys.length).toBeGreaterThan(0)
  })

  it.each(otherFiles)('%s has the same keys as en.json', (file) => {
    const content = JSON.parse(readFileSync(join(localesDir, file), 'utf-8'))
    const keys = flattenKeys(content).sort()
    expect(keys).toEqual(enKeys)
  })
})
