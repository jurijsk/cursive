import lettersData from '~~/content/letters.json';

export type Dialect = 'palestinian' | 'lebanese';
export type GlyphKind = 'letter' | 'diacritic' | 'extender';

export interface LetterPronunciation {
	ipa: string;
	description: string;
	englishExamples: string[];
}

interface LetterInfoBase {
	char: string;
	name: string;
	arabicName: string;
	transliteration: string[];
	pronunciation: Record<Dialect, LetterPronunciation>;
}

export interface LetterForms {
	isolated: string;
	initial: string;
	medial: string;
	final: string;
}

export interface LetterCharacterInfo extends LetterInfoBase {
	kind: 'letter';
	forms: LetterForms;
}

export interface DiacriticInfo extends LetterInfoBase {
	kind: 'diacritic';
}

export interface ExtenderInfo extends LetterInfoBase {
	kind: 'extender';
}

export type LetterInfo = LetterCharacterInfo | DiacriticInfo | ExtenderInfo;

interface RawLetterInfo extends LetterInfoBase {
	kind?: GlyphKind;
	forms?: LetterForms;
}

function normalizeLetterInfo(raw: RawLetterInfo): LetterInfo {
	const kind = raw.kind ?? 'letter';

	if(kind === 'letter') {
		if(!raw.forms) {
			throw new Error(`Letter ${raw.char} is missing forms in letters.json`);
		}

		return {
			...raw,
			kind,
			forms: raw.forms
		};
	}

	return {
		char: raw.char,
		name: raw.name,
		arabicName: raw.arabicName,
		kind,
		transliteration: raw.transliteration,
		pronunciation: raw.pronunciation
	};
}

// content/letters.json is the source of truth — kept in content/ so it can later
// be served / edited via @nuxt/content. The TS layer just provides types.
export const letters = Object.fromEntries(
	Object.entries(lettersData as Record<string, RawLetterInfo>).map(([char, info]) => [char, normalizeLetterInfo(info)])
) as Record<string, LetterInfo>;

export function getLetterInfo(char: string): LetterInfo | null {
	return letters[char] ?? null;
}
