import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['test/unit/*.{test,spec}.ts'],
		environment: 'node',
		coverage: {
			enabled: true,
			provider: 'v8'
		}
	}
});
