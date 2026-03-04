export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/eslint'],

  css: ['~/assets/css/main.css'],

  ssr: false,

  devtools: { enabled: true },

  colorMode: {
    preference: 'light',
  },

  compatibilityDate: '2025-03-01',
})
