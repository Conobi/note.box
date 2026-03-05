import { expect, test } from '@nuxt/test-utils/playwright'
import { getSidebarSettingsButton, resetApp, seedNote } from './helpers'

test.describe('i18n', () => {
  test.beforeEach(async ({ page, goto }) => {
    await resetApp(page, goto)
  })

  test('switch language to French updates UI strings', async ({ page, goto }) => {
    await seedNote(page, goto)

    const settingsBtn = getSidebarSettingsButton(page)
    await settingsBtn.click({ force: true })

    // Click "Français" locale option
    await page.getByRole('dialog').getByRole('button', { name: 'Français' }).click()

    // Settings title should now be in French
    await expect(page.getByRole('dialog').locator('text=Police')).toBeVisible()

    // Close and check sidebar
    await page.keyboard.press('Escape')

    // Empty state or note list should use French
    await expect(page.locator('aside')).toContainText('note.box')
  })

  test('Arabic locale sets RTL direction', async ({ page, goto }) => {
    await seedNote(page, goto)

    const settingsBtn = getSidebarSettingsButton(page)
    await settingsBtn.click({ force: true })

    // Click Arabic
    await page.getByRole('dialog').getByRole('button', { name: 'العربية' }).click()
    await page.keyboard.press('Escape')

    // html should have dir="rtl" and lang="ar"
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
  })

  test('language persists across reload', async ({ page, goto }) => {
    await seedNote(page, goto)

    const settingsBtn = getSidebarSettingsButton(page)
    await settingsBtn.click({ force: true })

    // Switch to German
    await page.getByRole('dialog').getByRole('button', { name: 'Deutsch' }).click()
    await page.keyboard.press('Escape')

    // Reload
    await goto('/notes/test-note', { waitUntil: 'hydration' })

    // Open settings and verify German is still active
    const settingsBtn2 = getSidebarSettingsButton(page)
    await settingsBtn2.click({ force: true })

    const deutschButton = page.getByRole('dialog').getByRole('button', { name: 'Deutsch' })
    await expect(deutschButton).toHaveClass(/text-primary/)
  })

  test('switching back to English restores LTR', async ({ page, goto }) => {
    await seedNote(page, goto)

    const settingsBtn = getSidebarSettingsButton(page)
    await settingsBtn.click({ force: true })

    // Switch to Arabic
    await page.getByRole('dialog').getByRole('button', { name: 'العربية' }).click()
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')

    // Switch back to English
    await page.getByRole('dialog').getByRole('button', { name: 'English' }).click()
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })
})
