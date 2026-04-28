import { expect, test } from '@nuxt/test-utils/playwright';
import type { Page } from '@playwright/test';

/**
 * Waits for a /api/shape response to complete. Must be called BEFORE the
 * action that triggers the request so the Promise is already listening.
 */
function nextShapeResponse(page: Page) {
	return page.waitForResponse(
		resp => resp.url().includes('/api/shape') && resp.status() === 200,
		{ timeout: 8000 }
	);
}

/**
 * Returns the concatenated `d` attributes of all glyph paths as a fingerprint.
 */
async function svgFingerprint(page: Page): Promise<string> {
	const paths = page.locator('svg path.glyph-path');
	const count = await paths.count();
	const ds: string[] = [];
	for(let i = 0; i < count; i++) {
		ds.push(await paths.nth(i).getAttribute('d') ?? '');
	}
	return ds.join('|');
}

test.describe('example word picker', () => {
	test('first example click updates the SVG', async ({ page, goto }) => {
		await goto('/', { waitUntil: 'hydration' });
		// Wait for initial render to settle
		await page.waitForSelector('svg path.glyph-path', { timeout: 8000 });
		const initialFingerprint = await svgFingerprint(page);
		expect(initialFingerprint.length).toBeGreaterThan(0);

		// Arm the response listener BEFORE the click so we don't miss the request
		const responsePromise = nextShapeResponse(page);
		await page.locator('.examples button', { hasText: 'habibi' }).click();
		await responsePromise;

		await expect(page.locator('input')).toHaveValue('حبيبي', { timeout: 3000 });
		const afterFirstPick = await svgFingerprint(page);
		expect(afterFirstPick).not.toBe(initialFingerprint);
	});

	test('second example click updates the SVG again', async ({ page, goto }) => {
		await goto('/', { waitUntil: 'hydration' });
		await page.waitForSelector('svg path.glyph-path', { timeout: 8000 });

		// First pick
		let responsePromise = nextShapeResponse(page);
		await page.locator('.examples button', { hasText: 'habibi' }).click();
		await responsePromise;
		const afterFirstPick = await svgFingerprint(page);

		// Second pick
		responsePromise = nextShapeResponse(page);
		await page.locator('.examples button', { hasText: 'shukran' }).click();
		await responsePromise;
		const afterSecondPick = await svgFingerprint(page);

		expect(afterSecondPick).not.toBe(afterFirstPick);
	});

	test('each example sends its own text to the API', async ({ page, goto }) => {
		await goto('/', { waitUntil: 'hydration' });
		await page.waitForSelector('svg path.glyph-path', { timeout: 8000 });

		// First pick — capture request body from the response
		let responsePromise = nextShapeResponse(page);
		await page.locator('.examples button', { hasText: 'habibi' }).click();
		const resp1 = await responsePromise;
		const req1 = JSON.parse(resp1.request().postData() ?? '{}');

		// Second pick
		responsePromise = nextShapeResponse(page);
		await page.locator('.examples button', { hasText: 'shukran' }).click();
		const resp2 = await responsePromise;
		const req2 = JSON.parse(resp2.request().postData() ?? '{}');

		expect(req1.text).toBe('حبيبي');
		expect(req2.text).toBe('شكرا');
		expect(req1.text).not.toBe(req2.text);
	});

	test('picking the same example twice re-renders consistently', async ({ page, goto }) => {
		await goto('/', { waitUntil: 'hydration' });
		await page.waitForSelector('svg path.glyph-path', { timeout: 8000 });

		// First pick: default → habibi
		let responsePromise = nextShapeResponse(page);
		await page.locator('.examples button', { hasText: 'habibi' }).click();
		await responsePromise;
		const firstRender = await svgFingerprint(page);

		// Detour: habibi → shukran
		responsePromise = nextShapeResponse(page);
		await page.locator('.examples button', { hasText: 'shukran' }).click();
		await responsePromise;

		// Return: shukran → habibi
		responsePromise = nextShapeResponse(page);
		await page.locator('.examples button', { hasText: 'habibi' }).click();
		await responsePromise;
		const secondRender = await svgFingerprint(page);

		expect(secondRender).toBe(firstRender);
	});

	test('only 1 API request per example click (no duplicates)', async ({ page, goto }) => {
		await goto('/', { waitUntil: 'hydration' });
		await page.waitForSelector('svg path.glyph-path', { timeout: 8000 });

		const requests: Array<{ text: string }> = [];
		page.on('request', req => {
			if (req.url().includes('/api/shape')) {
				try {
					const body = req.postData();
					if (body) requests.push(JSON.parse(body));
				} catch (e) {}
			}
		});

		// Click one example and wait for debounce + timers to settle
		await page.locator('.examples button', { hasText: 'muslim' }).click();
		await page.waitForResponse(
			resp => resp.url().includes('/api/shape') && resp.status() === 200,
			{ timeout: 8000 }
		);
		await page.waitForTimeout(1000); // Wait for any trailing timers

		// Should be exactly 1 request
		expect(requests.length).toBe(1);
		expect(requests[0]?.text).toBe('مُسْلِمٌ');

		// Click another example
		requests.length = 0;
		await page.locator('.examples button', { hasText: 'qur\'aan' }).click();
		await page.waitForResponse(
			resp => resp.url().includes('/api/shape') && resp.status() === 200,
			{ timeout: 8000 }
		);
		await page.waitForTimeout(1000);

		// Should still be exactly 1 request
		expect(requests.length).toBe(1);
		expect(requests[0]?.text).toBe('قُرْآنٌ');
	});
});
