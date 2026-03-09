import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'
import type { ConfigOptions } from '@nuxt/test-utils/playwright'

export default defineConfig<ConfigOptions>({
  testDir: './test/e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  maxFailures: process.env.CI ? 0 : 1,
  reporter: 'html',
  // Nuxt build via _nuxtHooks worker fixture can take over 30s (font resolution,
  // vite optimizeDeps, etc.) — raise the default 30s test timeout accordingly.
  timeout: 120_000,

  use: {
    locale: 'en-US',
    trace: 'on-first-retry',
    nuxt: {
      rootDir: fileURLToPath(new URL('.', import.meta.url)),
      // Disable remote font providers so @nuxt/fonts never hits the network
      // during the test build. CSS font-family declarations still work via
      // system font fallbacks. Cast needed: @nuxt/fonts augments NuxtConfig
      // at module scope but that augmentation isn't resolved here.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      nuxtConfig: { fonts: { providers: { google: false, bunny: false, fontsource: false, fontshare: false, googleicons: false } } } as any,
    },
  },

  projects: [
    {
      name: 'chromium',
      testIgnore: '**/swipe.e2e.ts',
      use: { ...devices['Desktop Chrome'], locale: 'en-US' },
    },
    {
      // Touch-emulated mobile project: hasTouch=true, correct UA, 393x851 viewport.
      // Runs only the swipe tests — those are the only tests that require real touch
      // events. Responsive layout tests use manual setViewportSize and run on chromium.
      name: 'mobile-chrome',
      testMatch: '**/swipe.e2e.ts',
      use: { ...devices['Pixel 5'], locale: 'en-US' },
    },
  ],
})
