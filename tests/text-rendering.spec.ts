import { expect, test } from '@nuxt/test-utils/playwright';

test('home page loads', async ({ page, goto }) => {
	await goto('/', { waitUntil: 'hydration' });
	expect(page).toBeDefined();
});

test('text page renders with Arabic text', async ({ page, goto }) => {
	const testText = 'مرحبا';
	await goto(`/${encodeURIComponent(testText)}`, { waitUntil: 'hydration' });
  
	// Verify the page contains the text
	await expect(page.locator('span.font-family-tajawal')).toContainText(testText);
});

test('text page renders with English text', async ({ page, goto }) => {
	const testText = 'Hello';
	await goto(`/${encodeURIComponent(testText)}`, { waitUntil: 'hydration' });
  
	// Verify the page contains the text
	await expect(page.locator('span.font-family-tajawal')).toContainText(testText);
});

test('text page renders with mixed text', async ({ page, goto }) => {
	const testText = 'Hello مرحبا';
	await goto(`/${encodeURIComponent(testText)}`, { waitUntil: 'hydration' });
  
	// Verify the page contains the text
	await expect(page.locator('span.font-family-tajawal')).toContainText(testText);
});
