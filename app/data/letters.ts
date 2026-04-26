import lettersData from '~~/content/letters.json';

export type Dialect = 'palestinian' | 'lebanese';
export type GlyphKind = 'letter' | 'diacritic' | 'extender';

export interface LetterPronunciation {
	ipa: string;
	description: string;
	englishExamples: string[];
}

export interface LetterInfo {
	char: string;
	name: string;
	arabicName: string;
	kind?: GlyphKind;
	forms?: {
		isolated: string;
		initial: string;
		medial: string;
		final: string;
	};
	transliteration: string[];
	pronunciation: Record<Dialect, LetterPronunciation>;
}

// content/letters.json is the source of truth — kept in content/ so it can later
// be served / edited via @nuxt/content. The TS layer just provides types.
export const letters = lettersData as Record<string, LetterInfo>;

export function getLetterInfo(char: string): LetterInfo | null {
	return letters[char] ?? null;
}
