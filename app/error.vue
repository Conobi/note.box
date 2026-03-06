<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const { t } = useI18n()

const message = computed(() => {
  return props.error.statusCode === 404
    ? t('error.notFound')
    : t('error.generic')
})
</script>

<template>
  <UApp>
    <div class="min-h-screen bg-default flex items-center justify-center">
      <div class="flex flex-col items-center gap-6 text-center px-8">
        <p class="text-[8rem] leading-none font-extralight text-dimmed tabular-nums tracking-tighter select-none">
          {{ error.statusCode }}
        </p>
        <p class="text-lg text-muted max-w-xs">
          {{ message }}
        </p>
        <UButton
          :label="t('error.backHome')"
          icon="i-lucide-arrow-left"
          variant="ghost"
          color="neutral"
          @click="clearError({ redirect: '/' })"
        />
      </div>
    </div>
  </UApp>
</template>
