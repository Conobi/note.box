<script setup lang="ts">
const { locale } = useAppSettings()
const colorMode = useColorMode()

const RTL_LOCALES = new Set(['ar'])

useHead({
  titleTemplate: (title?: string) => title ? `${title} - note.box` : 'note.box',
  htmlAttrs: {
    lang: () => locale.value,
    dir: () => RTL_LOCALES.has(locale.value) ? 'rtl' : 'ltr',
  },
  meta: [
    { name: 'description', content: 'A minimal, distraction-free note-taking app.' },
    { name: 'theme-color', content: () => colorMode.value === 'dark' ? '#020617' : '#ffffff' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
  ],
})
</script>

<template>
  <UApp :tooltip="{ delayDuration: 150 }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
