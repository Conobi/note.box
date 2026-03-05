import { expect, test } from '@nuxt/test-utils/playwright'
import { getSidebarSettingsButton, resetApp, seedNote } from './helpers'

test.describe('Settings', () => {
  test.beforeEach(async ({ page, goto }) => {
    await resetApp(page, goto)
  })

  test('change font to a specific Google Font', async ({ page, goto }) => {
    await seedNote(page, goto)

    const settingsBtn = getSidebarSettingsButton(page)
    await settingsBtn.click({ force: true })

    // Click "Inconsolata" font option
    await page.getByRole('dialog').getByRole('button', { name: 'Inconsolata' }).click()

    // Close modal
    await page.keyboard.press('Escape')

    // Verify font class applied to the app wrapper
    await expect(page.locator('.font-inconsolata')).toBeVisible()
  })

  test('font selector highlights the active font', async ({ page, goto }) => {
    await seedNote(page, goto)

    const settingsBtn = getSidebarSettingsButton(page)
    await settingsBtn.click({ force: true })

    const dialog = page.getByRole('dialog')

    // Default font is Inter — its button should have the active style
    const interButton = dialog.getByRole('button', { name: 'Inter' })
    await expect(interButton).toHaveClass(/text-primary/)

    // Switch to Vollkorn
    await dialog.getByRole('button', { name: 'Vollkorn' }).click()

    // Vollkorn should now be active, Inter should not
    const vollkornButton = dialog.getByRole('button', { name: 'Vollkorn' })
    await expect(vollkornButton).toHaveClass(/text-primary/)
    await expect(interButton).not.toHaveClass(/text-primary/)
  })

  test('font setting persists across reload', async ({ page, goto }) => {
    await seedNote(page, goto)

    const settingsBtn = getSidebarSettingsButton(page)
    await settingsBtn.click({ force: true })
    await page.getByRole('dialog').getByRole('button', { name: 'Source Serif 4' }).click()
    await page.keyboard.press('Escape')

    await expect(page.locator('.font-source-serif-4')).toBeVisible()

    // Reload
    await goto('/notes/test-note', { waitUntil: 'hydration' })
    await expect(page.locator('.font-source-serif-4')).toBeVisible()
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

  test('export button is enabled when notes exist', async ({ page, goto }) => {
    await seedNote(page, goto)

    const settingsBtn = getSidebarSettingsButton(page)
    await settingsBtn.click({ force: true })

    const exportBtn = page.getByRole('dialog').getByRole('button', { name: 'Export all notes' })
    await expect(exportBtn).toBeEnabled()
  })
})
