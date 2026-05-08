/**
 * Playwright config for tests that run against an already-running dev/preview
 * server (no Nuxt test-utils server spin-up).
 *
 * Start the server first: `npm run dev`  (default port 3001)
 * Then run:  npx playwright test --config=playwright.live.config.ts
 */
import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL ?? 'http://localhost:3001';

export default defineConfig({
	testDir: './tests',
	testMatch: /.*\.spec\.ts$/,
	testIgnore: /tests\/e2e\/.*/,
	fullyParallel: false,
	retries: 0,
	reporter: 'line',
	use: {
		baseURL: BASE_URL,
		trace: 'on-first-retry',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	]
});
