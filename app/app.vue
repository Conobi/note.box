<script setup lang="ts">
const { locale } = useAppSettings()

const RTL_LOCALES = new Set(['ar'])

useHead({
  htmlAttrs: {
    lang: () => locale.value,
    dir: () => RTL_LOCALES.has(locale.value) ? 'rtl' : 'ltr',
  },
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
