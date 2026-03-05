export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/eslint', '@nuxt/fonts', '@nuxtjs/i18n'],

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

  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'en',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'note.box:locale',
      fallbackLocale: 'en',
    },
    locales: [
      { code: 'en', name: 'English', language: 'en' },
      { code: 'es', name: 'Español', language: 'es' },
      { code: 'fr', name: 'Français', language: 'fr' },
      { code: 'de', name: 'Deutsch', language: 'de' },
      { code: 'pt', name: 'Português', language: 'pt' },
      { code: 'zh', name: '中文', language: 'zh' },
      { code: 'ja', name: '日本語', language: 'ja' },
      { code: 'ko', name: '한국어', language: 'ko' },
      { code: 'ar', name: 'العربية', language: 'ar', dir: 'rtl' },
    ],
  },

  compatibilityDate: '2025-03-01',
})
