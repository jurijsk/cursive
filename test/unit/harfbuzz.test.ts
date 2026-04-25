import { describe, expect, it } from 'vitest';
import initHarfBuzz from 'harfbuzzjs/hb';
import createharfBuzzWrap from 'harfbuzzjs/hbjs';

describe('HarfBuzz WASM', () => {
	it('should initialize HarfBuzz module', async () => {
		const hbRaw = await initHarfBuzz();
		expect(hbRaw).toBeDefined();
	});

	it('should create HarfBuzz wrapper', async () => {
		const hbRaw = await initHarfBuzz();
		const harfBuzz = createharfBuzzWrap(hbRaw);
		expect(harfBuzz).toBeDefined();
	});

	it('should have shape function available', async () => {
		const hbRaw = await initHarfBuzz();
		const harfBuzz = createharfBuzzWrap(hbRaw);
		expect(typeof harfBuzz.shape).toBe('function');
	});
});
