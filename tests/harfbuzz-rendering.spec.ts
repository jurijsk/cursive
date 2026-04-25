import { expect, test } from '@nuxt/test-utils/playwright';

test('index page renders Arabic text as SVG paths', async ({ page, goto }) => {
	const testText = 'مرحبا';
	await goto('/', { waitUntil: 'hydration' });

	// Wait for HarfBuzz to initialize
	await page.waitForSelector('svg', { timeout: 10000 });

	// Default input value is the same Arabic text
	const input = page.locator('input');
	await expect(input).toHaveValue(testText, { timeout: 5000 });

	// Verify the heading displays the text
	const heading = page.locator('h1');
	await expect(heading).toContainText(testText, { timeout: 5000 });

	// Verify SVG is rendered
	const svg = page.locator('svg');
	await expect(svg).toBeVisible({ timeout: 5000 });

	// Verify SVG contains path elements (glyph outlines)
	const paths = page.locator('svg path');
	const pathCount = await paths.count();
	expect(pathCount).toBeGreaterThan(0);
});

test('index page updates SVG when text input changes', async ({ page, goto }) => {
	await goto('/', { waitUntil: 'hydration' });

	// Wait for initial SVG render
	await page.waitForSelector('svg', { timeout: 10000 });

	// Change the input text
	const input = page.locator('input');
	await input.click();
	await input.fill('hello');

	// Wait for SVG to update
	await page.waitForTimeout(500);
	await input.fill('مرحبا');
	await page.waitForTimeout(500);

	// Verify SVG still has paths after text change
	const updatedPaths = await page.locator('svg path').count();
	expect(updatedPaths).toBeGreaterThan(0);

	// Verify heading updated
	const heading = page.locator('h1');
	await expect(heading).toContainText('مرحبا', { timeout: 5000 });
});

test('index page handles mixed text (English and Arabic)', async ({ page, goto }) => {
	const mixedText = 'Hello مرحبا World';
	await goto('/', { waitUntil: 'hydration' });

	// Wait for HarfBuzz to process
	await page.waitForSelector('svg', { timeout: 5000 });

	const input = page.locator('input');
	await input.fill(mixedText);
	await page.waitForTimeout(500);

	// Verify SVG contains rendered glyphs
	const paths = page.locator('svg path');
	const pathCount = await paths.count();
	expect(pathCount).toBeGreaterThan(0);

	// Verify text is displayed in heading
	const heading = page.locator('h1');
	await expect(heading).toContainText(mixedText);
});

test('index page SVG has expected styling', async ({ page, goto }) => {
	await goto('/', { waitUntil: 'hydration' });

	// Wait for SVG render
	await page.waitForSelector('svg', { timeout: 5000 });

	// Verify SVG paths have fill="black"
	const paths = page.locator('svg path');
	const firstPath = paths.first();
	await expect(firstPath).toHaveAttribute('fill', 'black');

	// Verify SVG has border (inline style)
	const svg = page.locator('svg');
	const style = await svg.getAttribute('style');
	expect(style).toContain('border');
});
