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
  reporter: 'html',
  // Nuxt build via _nuxtHooks worker fixture can take over 30s (font resolution,
  // vite optimizeDeps, etc.) — raise the default 30s test timeout accordingly.
  timeout: 120_000,

  use: {
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
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
