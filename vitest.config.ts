import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			'~': fileURLToPath(new URL('./app', import.meta.url)),
			'~~': fileURLToPath(new URL('.', import.meta.url))
		}
	},
	test: {
		include: ['test/unit/*.{test,spec}.ts'],
		environment: 'node',
		coverage: {
			enabled: true,
			provider: 'v8'
		}
	}
});
