import { expect, test } from '@nuxt/test-utils/playwright'
import { resetApp, switchToLocale } from './helpers'

/**
 * Check whether an element's content overflows its container.
 * Returns true if content overflows (i.e. there IS a problem).
 */
async function hasOverflow(locator: import('@playwright/test').Locator): Promise<boolean> {
  return locator.evaluate((el) => {
    const style = getComputedStyle(el)
    // Elements using truncation/clamp handle overflow intentionally
    if (style.textOverflow === 'ellipsis') return false
    if (style.webkitLineClamp && style.webkitLineClamp !== 'none') return false
    return el.scrollWidth > el.clientWidth
  })
}

test.describe('i18n overflow detection', () => {
  test.beforeEach(async ({ page, goto }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await resetApp(page, goto)
  })

  test('fr: sidebar search placeholder does not overflow', async ({ page, goto }) => {
    await switchToLocale(page, goto, 'Français')

    // Hover sidebar to reveal search
    await page.locator('aside').hover()
    const input = page.locator('aside input[type="text"]')
    await expect(input).toBeVisible()

    expect(await hasOverflow(input)).toBe(false)
  })

  test('de: sidebar search placeholder does not overflow', async ({ page, goto }) => {
    await switchToLocale(page, goto, 'Deutsch')

    await page.locator('aside').hover()
    const input = page.locator('aside input[type="text"]')
    await expect(input).toBeVisible()

    expect(await hasOverflow(input)).toBe(false)
  })

  test('ar: RTL sidebar search does not overflow', async ({ page, goto }) => {
    await switchToLocale(page, goto, 'العربية')

    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')

    await page.locator('aside').hover()
    const input = page.locator('aside input[type="text"]')
    await expect(input).toBeVisible()

    expect(await hasOverflow(input)).toBe(false)
  })

  test('de: settings modal export button does not overflow', async ({ page, goto }) => {
    await switchToLocale(page, goto, 'Deutsch')

    // Re-open settings
    const settingsBtn = page.locator('aside').getByRole('button', { name: /einstellung/i })
    await settingsBtn.click({ force: true })

    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()

    // Check the export button text doesn't overflow
    const exportBtn = modal.locator('button').filter({ hasText: /exportieren|notizen/i })
    if (await exportBtn.count() > 0) {
      expect(await hasOverflow(exportBtn.first())).toBe(false)
    }
  })

  test('fr mobile: slideover search does not overflow', async ({ page, goto }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await resetApp(page, goto)

    // Switch locale via mobile top bar (use icon-based selector since labels change with locale)
    const settingsBtn = page.locator('header').getByRole('button').last()
    await settingsBtn.click()
    await page.getByRole('dialog').getByRole('button', { name: 'Français' }).click()
    await page.keyboard.press('Escape')

    // Open mobile slideover (first button in header is the menu button)
    await page.locator('header').getByRole('button').first().click()

    const input = page.getByRole('dialog').locator('input[type="text"]')
    await expect(input).toBeVisible()

    expect(await hasOverflow(input)).toBe(false)
  })
})
