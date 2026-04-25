// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	future: { compatibilityVersion: 5 },
	devtools: { enabled: false },
	devServer: { port: 3001 },
	modules: ['@nuxt/fonts', '@nuxt/eslint', '@nuxt/test-utils'],
	css: ['@picocss/pico'],
	fonts: {
		families: [
			{ name: 'Tajawal', src: '/fonts/Tajawal-Regular.ttf' },
			{ name: 'Amiri', src: '/fonts/Amiri-Regular.ttf' },
			{ name: 'Noto Naskh Arabic', src: '/fonts/NotoNaskhArabic-Regular.ttf' },
			{ name: 'Reem Kufi', src: '/fonts/ReemKufi-Regular.ttf' }
		]
	}
});