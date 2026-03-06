import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// Max character lengths for keys in space-constrained UI areas
const CHARACTER_BUDGETS: Record<string, number> = {
  'noteList.searchPlaceholder': 18, // sidebar search input (~140px usable after icon + KBD badges)
  'app.newNote': 16, // tooltip / mobile button
  'app.settings': 14, // tooltip / sidebar button
  'app.openMenu': 16, // mobile menu button
  'settings.light': 10, // grid-cols-2 theme buttons
  'settings.dark': 10, // grid-cols-2 theme buttons
  'emptyState.newNote': 16, // CTA button label
  'noteListItem.deleteNote': 20, // tooltip on small button
  'settings.exportAll': 30, // block button in modal
}

function flattenEntries(obj: Record<string, unknown>, prefix = ''): [string, string][] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null) {
      return flattenEntries(value as Record<string, unknown>, fullKey)
    }
    return [[fullKey, value as string]] as [string, string][]
  })
}

const localesDir = join(__dirname, '../../app/locales')
const files = readdirSync(localesDir).filter(f => f.endsWith('.json'))

const localeData = files
  .filter(f => f !== 'en.json')
  .map(f => ({
    file: f,
    locale: f.replace('.json', ''),
    entries: new Map(flattenEntries(JSON.parse(readFileSync(join(localesDir, f), 'utf-8')))),
  }))

describe('i18n text expansion', () => {
  describe('character budgets', () => {
    const budgetedKeys = Object.entries(CHARACTER_BUDGETS)

    for (const { file, locale, entries } of localeData) {
      it.each(budgetedKeys)(`${file}: "%s" is within %i char budget`, (key, budget) => {
        const value = entries.get(key)
        expect(value, `missing key "${key}" in ${file}`).toBeDefined()
        expect(
          value!.length,
          `${locale} "${key}" is ${value!.length} chars ("${value}"), budget is ${budget}`,
        ).toBeLessThanOrEqual(budget)
      })
    }

  })

  describe('no empty values', () => {
    for (const { file, entries } of localeData) {
      it(`${file} has no empty translation values`, () => {
        const emptyKeys = [...entries.entries()]
          .filter(([, value]) => value.trim() === '')
          .map(([key]) => key)
        expect(emptyKeys, `empty values found in ${file}`).toEqual([])
      })
    }
  })
})
