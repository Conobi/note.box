import { expect, test } from '@nuxt/test-utils/playwright'
import { resetApp } from './helpers'

test.use({ locale: 'fr' })

test('adopts browser locale on first visit when no stored preference', async ({ page, goto }) => {
  await resetApp(page, goto)

  // html lang should match browser locale
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr')

  // Sidebar note title should display French "Sans titre", not English "Untitled"
  await expect(page.locator('aside').getByText('Sans titre').first()).toBeVisible()
})
