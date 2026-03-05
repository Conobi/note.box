import { expect, test } from '@nuxt/test-utils/playwright'
import {
  getMenuButton,
  getTopBarAddButton,
  getTopBarSettingsButton,
  resetApp,
  seedNotes,
} from './helpers'

const MOBILE = { width: 375, height: 812 }
const TABLET = { width: 768, height: 1024 }
const DESKTOP = { width: 1280, height: 800 }

test.describe('Responsive — Mobile', () => {
  test.beforeEach(async ({ page, goto }) => {
    await page.setViewportSize(MOBILE)
    await resetApp(page, goto)
  })

  test('sidebar is hidden and top bar is visible', async ({ page }) => {
    await expect(page.locator('aside')).toBeHidden()
    await expect(page.locator('header')).toBeVisible()
    await expect(getMenuButton(page)).toBeVisible()
  })

  test('hamburger opens slideover with note list', async ({ page, goto }) => {
    await seedNotes(page, goto, [
      { id: 'mob-1', title: 'Mobile Note' },
    ])
    await page.setViewportSize(MOBILE)

    await getMenuButton(page).click()
    // Note should be visible in the slideover panel
    const slideover = page.locator('[role="dialog"]')
    await expect(slideover.getByText('Mobile Note')).toBeVisible()
  })

  test('selecting a note closes slideover and navigates', async ({ page, goto }) => {
    await seedNotes(page, goto, [
      { id: 'mob-1', title: 'First Note' },
      { id: 'mob-2', title: 'Second Note' },
    ])
    await page.setViewportSize(MOBILE)

    await getMenuButton(page).click()
    await page.getByRole('link', { name: 'Second Note' }).click()

    await expect(page).toHaveURL(/\/notes\/mob-2/)
    // Slideover should close after route change
    await expect(page.locator('[data-state="open"]')).toBeHidden()
  })

  test('create note from top bar', async ({ page }) => {
    const currentUrl = page.url()
    await getTopBarAddButton(page).click()
    await expect(page).not.toHaveURL(currentUrl)
    await expect(page).toHaveURL(/\/notes\//)
  })

  test('settings opens from top bar', async ({ page }) => {
    await getTopBarSettingsButton(page).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })
})

test.describe('Responsive — Tablet', () => {
  test.beforeEach(async ({ page, goto }) => {
    await page.setViewportSize(TABLET)
    await resetApp(page, goto)
  })

  test('same layout as mobile — sidebar hidden, top bar visible', async ({ page }) => {
    await expect(page.locator('aside')).toBeHidden()
    await expect(page.locator('header')).toBeVisible()
    await expect(getMenuButton(page)).toBeVisible()
  })
})

test.describe('Responsive — Desktop', () => {
  test.beforeEach(async ({ page, goto }) => {
    await page.setViewportSize(DESKTOP)
    await resetApp(page, goto)
  })

  test('persistent sidebar visible, no top bar', async ({ page }) => {
    await expect(page.locator('aside')).toBeVisible()
    await expect(page.locator('header')).toBeHidden()
  })

  test('editor main has max-width 768px', async ({ page }) => {
    const main = page.locator('main')
    const maxWidth = await main.evaluate(el => getComputedStyle(el).maxWidth)
    expect(maxWidth).toBe('768px')
  })
})
