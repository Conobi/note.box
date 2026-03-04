import type { Locator, Page } from '@playwright/test'

type Goto = (url: string, options?: any) => Promise<void>

/** Navigate to the app, then clear localStorage and reload for a clean state. */
export async function resetApp(page: Page, goto: Goto) {
  await goto('/', { waitUntil: 'hydration' })
  await page.evaluate(() => localStorage.clear())
  await goto('/', { waitUntil: 'hydration' })
}

/** Seed a note directly into localStorage and reload. */
export async function seedNote(
  page: Page,
  goto: Goto,
  overrides: { id?: string, title?: string, body?: string } = {},
) {
  const id = overrides.id ?? 'test-note-1'
  const title = overrides.title ?? 'Test Note'
  const body = overrides.body ?? 'Hello world'
  const now = new Date().toISOString()

  await page.evaluate(({ id, title, body, now }) => {
    localStorage.clear()
    const note = {
      id,
      title,
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: title }] },
          { type: 'paragraph', content: [{ type: 'text', text: body }] },
        ],
      },
      createdAt: now,
      updatedAt: now,
    }
    localStorage.setItem('note.box:notes', JSON.stringify([note]))
  }, { id, title, body, now })

  await goto(`/notes/${id}`, { waitUntil: 'hydration' })
}

/** Seed multiple notes into localStorage. */
export async function seedNotes(
  page: Page,
  goto: Goto,
  notes: { id: string, title: string, body?: string }[],
) {
  await page.evaluate((notes) => {
    localStorage.clear()
    const stored = notes.map((n, i) => {
      const date = new Date(Date.now() - i * 60_000).toISOString()
      return {
        id: n.id,
        title: n.title,
        content: {
          type: 'doc',
          content: [
            { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: n.title }] },
            { type: 'paragraph', content: n.body ? [{ type: 'text', text: n.body }] : undefined },
          ],
        },
        createdAt: date,
        updatedAt: date,
      }
    })
    localStorage.setItem('note.box:notes', JSON.stringify(stored))
  }, notes)

  await goto(`/notes/${notes[0]!.id}`, { waitUntil: 'hydration' })
}

/** Wait for debounced auto-save to complete (300ms debounce + buffer). */
export async function waitForSave(page: Page) {
  await page.waitForTimeout(500)
}

export function getSidebarAddButton(page: Page): Locator {
  return page.locator('aside').getByRole('button', { name: 'New note' })
}

export function getSidebarSettingsButton(page: Page): Locator {
  return page.locator('aside').getByRole('button', { name: 'Settings' })
}

export function getNoteDeleteButton(page: Page, noteHref: string): Locator {
  return page.locator(`aside a[href="${noteHref}"]`).locator('..').getByRole('button', { name: 'Delete note' })
}
