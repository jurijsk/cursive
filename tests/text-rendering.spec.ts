import { expect, test } from '@nuxt/test-utils/playwright';

test('home page loads', async ({ page, goto }) => {
	await goto('/', { waitUntil: 'hydration' });
	expect(page).toBeDefined();
	const heading = page.locator('h1');
	await expect(heading).toContainText('مرحبا');
	await expect(page.locator('svg path').first()).toBeVisible();
});

test('text param renders Arabic via URL', async ({ page, goto }) => {
	const testText = 'سلام';
	await goto(`/${encodeURIComponent(testText)}`, { waitUntil: 'hydration' });

	const input = page.locator('input');
	await expect(input).toHaveValue(testText);

	const heading = page.locator('h1');
	await expect(heading).toContainText(testText);

	const paths = page.locator('svg path');
	expect(await paths.count()).toBeGreaterThan(0);
});

test('text param renders English via URL', async ({ page, goto }) => {
	const testText = 'Hello';
	await goto(`/${encodeURIComponent(testText)}`, { waitUntil: 'hydration' });

	await expect(page.locator('input')).toHaveValue(testText);
	await expect(page.locator('h1')).toContainText(testText);
	expect(await page.locator('svg path').count()).toBeGreaterThan(0);
});

test('text param renders mixed text via URL', async ({ page, goto }) => {
	const testText = 'Hello مرحبا';
	await goto(`/${encodeURIComponent(testText)}`, { waitUntil: 'hydration' });

	await expect(page.locator('input')).toHaveValue(testText);
	await expect(page.locator('h1')).toContainText(testText);
	expect(await page.locator('svg path').count()).toBeGreaterThan(0);
});
