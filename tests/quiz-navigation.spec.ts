import { expect, test } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL ?? 'http://localhost:3001';

test.describe('quiz keyboard navigation', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(BASE_URL);

		// Wait for Nuxt hydration to complete before interacting.
		// useNuxtApp().isHydrating starts as true and becomes false once
		// the Vue app is mounted and all async page setup (useAsyncData etc.)
		// has settled. Only after this point are v-model watchers active.
		await page.waitForFunction(
			() => {
				const app = (window as any).useNuxtApp?.();
				return app && app.isHydrating === false;
			},
			{ timeout: 15000 }
		);

		// Arm the response listener BEFORE the input fill so we don't miss it.
		// The fill triggers Vue's v-model watch → debounced refresh() → POST /api/shape.
		// Receiving this response is the definitive proof that:
		//   (a) Vue is hydrated and event handlers are attached, and
		//   (b) glyphClusters / quizQueue are freshly populated for حبيبي.
		const shapeReady = page.waitForResponse(
			resp => resp.url().includes('/api/shape') && resp.status() === 200,
			{ timeout: 15000 }
		);
		await page.locator('#shape_input').fill('حبيبي');
		await shapeReady;

		await page.locator('.quiz_cta').click();
		await expect(page.locator('.osk')).toBeVisible({ timeout: 3000 });
	});

	test('starts at step 1', async ({ page }) => {
		const text = await page.locator('.quiz_progress').textContent();
		expect(text).toMatch(/^1 \/ \d+$/);
	});

	test('◀ advances to step 2 (next in Arabic reading order)', async ({ page }) => {
		await page.locator('.osk_controls button[aria-label="Go left"]').click();
		const text = await page.locator('.quiz_progress').textContent();
		expect(text).toMatch(/^2 \/ \d+$/);
	});

	test('◀ then ▶ returns to step 1', async ({ page }) => {
		const leftBtn = page.locator('.osk_controls button[aria-label="Go left"]');
		const rightBtn = page.locator('.osk_controls button[aria-label="Go right"]');

		await leftBtn.click();
		await expect(page.locator('.quiz_progress')).toContainText('2 /');

		await rightBtn.click();
		await expect(page.locator('.quiz_progress')).toContainText('1 /');
	});

	test('▶ at step 1 stays at step 1 (no wrap-around)', async ({ page }) => {
		await page.locator('.osk_controls button[aria-label="Go right"]').click();
		await expect(page.locator('.quiz_progress')).toContainText('1 /');
	});

	test('◀ through all steps closes the quiz', async ({ page }) => {
		const leftBtn = page.locator('.osk_controls button[aria-label="Go left"]');

		const text = await page.locator('.quiz_progress').textContent() ?? '';
		const total = parseInt(text.split('/')[1] ?? '0', 10);
		expect(total).toBeGreaterThan(0);

		for(let i = 0; i < total; i++) {
			await leftBtn.click();
		}
		await expect(page.locator('.osk')).not.toBeVisible({ timeout: 2000 });
	});
});
