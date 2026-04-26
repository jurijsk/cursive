import { defineStore } from 'pinia';
import type { Dialect } from '~/data/letters';

export type FontKey = 'tajawal' | 'amiri' | 'noto-naskh' | 'reem-kufi';

export const useSettingsStore = defineStore('settings', () => {
	const font = ref<FontKey>('tajawal');
	const dialect = ref<Dialect>('palestinian');
	return { font, dialect };
}, {
	persist: true
});
