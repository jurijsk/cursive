import { describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import TextPage from '~/pages/[text].vue';

describe('Text Page Component', () => {
	it('mounts the text page component', async () => {
		const component = await mountSuspended(TextPage, {
			props: { text: 'مرحبا' }
		});
		expect(component).toBeDefined();
	});

	it('displays the text parameter', async () => {
		const component = await mountSuspended(TextPage);
		expect(component.text()).toBeDefined();
	});

	it('applies Tajawal font family class', async () => {
		const component = await mountSuspended(TextPage);
		const span = component.find('span');
		expect(span.classes()).toContain('font-family-tajawal');
	});
});
