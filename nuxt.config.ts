export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/eslint', '@nuxt/fonts'],

  css: ['~/assets/css/main.css'],

  ssr: false,

  devtools: { enabled: true },

  colorMode: {
    preference: 'light',
  },

  fonts: {
    defaults: {
      fallbacks: {
        serif: ['Georgia', 'Times New Roman', 'serif'],
        'sans-serif': ['ui-sans-serif', 'system-ui', 'sans-serif'],
        monospace: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
    experimental: {
      processCSSVariables: true,
    },
  },

  compatibilityDate: '2025-03-01',
})
