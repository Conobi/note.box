import type { Locator, Page } from '@playwright/test'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Goto = (url: string, options?: any) => Promise<any>

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    || 'untitled'
}

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
  const slug = slugify(title)
  const now = new Date().toISOString()

  await page.evaluate(({ id, slug, title, body, now }) => {
    localStorage.clear()
    const note = {
      id,
      slug,
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
  }, { id, slug, title, body, now })

  await goto(`/notes/${slug}`, { waitUntil: 'hydration' })
}

/** Seed multiple notes into localStorage. */
export async function seedNotes(
  page: Page,
  goto: Goto,
  notes: { id: string, title: string, body?: string }[],
) {
  const notesWithSlugs = notes.map(n => ({ ...n, slug: slugify(n.title) }))

  await page.evaluate((notes) => {
    localStorage.clear()
    const stored = notes.map((n, i) => {
      const date = new Date(Date.now() - i * 60_000).toISOString()
      return {
        id: n.id,
        slug: n.slug,
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
  }, notesWithSlugs)

  await goto(`/notes/${notesWithSlugs[0]!.slug}`, { waitUntil: 'hydration' })
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

export function getMenuButton(page: Page): Locator {
  return page.getByRole('button', { name: 'Open menu' })
}

export function getTopBarAddButton(page: Page): Locator {
  return page.locator('header').getByRole('button', { name: 'New note' })
}

export function getTopBarSettingsButton(page: Page): Locator {
  return page.locator('header').getByRole('button', { name: 'Settings' })
}
