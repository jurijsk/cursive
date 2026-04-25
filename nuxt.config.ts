// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	future: { compatibilityVersion: 5 },
	devtools: { enabled: false },
	modules: ['@nuxt/fonts', '@nuxt/eslint', '@nuxt/test-utils'],
	css: ['@picocss/pico']
});