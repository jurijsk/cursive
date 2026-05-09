import { expect, test } from '@nuxt/test-utils/playwright';
import type { Page } from '@playwright/test';

const TARGET_TEXT = 'جَمِيلَةٌ';

// All fonts should produce the same navigation sequence.
// Reem Kufi currently has a bug where it produces duplicate glyphs instead of
// diacritics at certain positions. Once fixed, all should match this sequence.
const EXPECTED_FORWARD_SEQUENCE = ['ج', 'َ', 'م', 'ِ', 'ي', 'ل', 'َ', 'ة', 'ٌ'];

const EXPECTED_FORWARD_BY_FONT: Record<string, string[]> = {
	Tajawal: EXPECTED_FORWARD_SEQUENCE,
	Amiri: EXPECTED_FORWARD_SEQUENCE,
	'Noto Naskh': EXPECTED_FORWARD_SEQUENCE,
	'Reem Kufi': EXPECTED_FORWARD_SEQUENCE
};

const stripTatweel = (value: string | null): string => (value ?? '').replaceAll('ـ', '').trim();

function waitForShapeResponse(page: Page): Promise<import('@playwright/test').Response> {
	return page.waitForResponse(
		response => response.url().includes('/api/shape') && response.status() === 200,
		{ timeout: 15000 }
	);
}

async function setInputAndShape(page: Page, value: string): Promise<void> {
	await Promise.all([
		waitForShapeResponse(page),
		page.locator('#shape_input').fill(value)
	]);
}

async function selectFont(page: Page, label: string): Promise<void> {
	await Promise.all([
		waitForShapeResponse(page),
		page.locator('.font_btn', { hasText: label }).first().click()
	]);
}

async function resetSelection(page: Page): Promise<void> {
	// Changing the input clears selectedGlyph in the page watcher.
	await setInputAndShape(page, 'ج');
	await setInputAndShape(page, TARGET_TEXT);
}

async function collectForwardSequence(page: Page): Promise<string[]> {
	const leftButton = page.locator('.panel_nav .nav_btn').first();
	const hero = page.locator('.hero_letter');
	const sequence: string[] = [];

	let guard = 0;
	while(await leftButton.isEnabled()) {
		await leftButton.click();
		sequence.push(stripTatweel(await hero.textContent()));
		guard++;
		if(guard > 50) throw new Error('Forward navigation did not terminate.');
	}

	return sequence;
}

async function collectBackwardSequence(page: Page): Promise<string[]> {
	const rightButton = page.locator('.panel_nav .nav_btn').nth(1);
	const hero = page.locator('.hero_letter');
	const sequence: string[] = [];

	let guard = 0;
	while(await rightButton.isEnabled()) {
		await rightButton.click();
		sequence.push(stripTatweel(await hero.textContent()));
		guard++;
		if(guard > 50) throw new Error('Backward navigation did not terminate.');
	}

	return sequence;
}

test.describe('next/previous navigation on جَمِيلَةٌ', () => {
	test.beforeEach(async ({ page, goto }) => {
		await goto('/', { waitUntil: 'hydration' });
		await setInputAndShape(page, TARGET_TEXT);
		await expect(page.locator('.info_panel')).toBeVisible({ timeout: 5000 });
	});

	for(const [fontLabel, expectedForward] of Object.entries(EXPECTED_FORWARD_BY_FONT)) {
		test(`navigates forward/backward for ${fontLabel}`, async ({ page }) => {
			await selectFont(page, fontLabel);
			await resetSelection(page);

			const forward = await collectForwardSequence(page);
			expect(forward).toEqual(expectedForward);

			const backward = await collectBackwardSequence(page);
			expect(backward).toEqual(expectedForward.slice(0, -1).reverse());
		});
	}
});