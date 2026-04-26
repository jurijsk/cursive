import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const projectRoot = dirname(fileURLToPath(import.meta.url));

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	future: { compatibilityVersion: 5 },
	devtools: { enabled: false },
	devServer: { port: 3001 },
	nitro: {
		preset: 'azure',
		// Bundle public/ into the server function so HarfBuzz WASM and TTF
		// fonts are readable in the Azure Functions runtime, where
		// `process.cwd()` does not resolve to the source tree.
		// Absolute path is required — Nitro resolves a relative `dir`
		// against its own srcDir, not the project root.
		serverAssets: [
			{ baseName: 'public', dir: resolve(projectRoot, 'public') }
		]
	},
	modules: ['@nuxt/fonts', '@nuxt/eslint', '@nuxt/test-utils', '@pinia/nuxt', 'pinia-plugin-persistedstate/nuxt'],
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