import { expect, test } from '@nuxt/test-utils/playwright'
import { getSidebarSettingsButton, resetApp, seedNote } from './helpers'

test.describe('Settings', () => {
  test.beforeEach(async ({ page, goto }) => {
    await resetApp(page, goto)
  })

  test('change font and verify it applies', async ({ page, goto }) => {
    await seedNote(page, goto)

    const settingsBtn = getSidebarSettingsButton(page)
    await settingsBtn.click({ force: true })

    // Click "Mono" font option
    await page.getByRole('dialog').getByRole('button', { name: 'Mono' }).click()

    // Close modal
    await page.keyboard.press('Escape')

    // Verify font class applied to the app wrapper
    await expect(page.locator('.font-mono')).toBeVisible()
  })

  test('change theme to dark mode', async ({ page, goto }) => {
    await seedNote(page, goto)

    const settingsBtn = getSidebarSettingsButton(page)
    await settingsBtn.click({ force: true })

    // Click "Dark" theme option
    await page.getByRole('dialog').getByRole('button', { name: 'Dark' }).click()
    await page.keyboard.press('Escape')

    // Dark mode should apply a class on html element
    await expect(page.locator('html')).toHaveClass(/dark/)
  })

  test('settings persist across reload', async ({ page, goto }) => {
    await seedNote(page, goto)

    const settingsBtn = getSidebarSettingsButton(page)
    await settingsBtn.click({ force: true })
    await page.getByRole('dialog').getByRole('button', { name: 'Sans' }).click()
    await page.keyboard.press('Escape')

    await expect(page.locator('.font-sans')).toBeVisible()

    // Reload
    await goto('/notes/test-note-1', { waitUntil: 'hydration' })
    await expect(page.locator('.font-sans')).toBeVisible()
  })

  test('export button is enabled when notes exist', async ({ page, goto }) => {
    await seedNote(page, goto)

    const settingsBtn = getSidebarSettingsButton(page)
    await settingsBtn.click({ force: true })

    const exportBtn = page.getByRole('dialog').getByRole('button', { name: 'Export all notes' })
    await expect(exportBtn).toBeEnabled()
  })
})
