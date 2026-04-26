export interface SpellingSubstitution {
	bare: string;
	canonical: string;
	note: string;
}

// Words whose conventional spelling carries diacritics that are usually omitted
// in everyday typing — typically a dagger alef (U+0670) for a long /aː/, or a
// shadda + dagger alef on Allah. With OpenType ligatures disabled (so each
// letter renders as a separate clickable glyph), these diacritics no longer
// "appear for free" via the font's Allah ligature, so we offer to insert them.
export const spellings: SpellingSubstitution[] = [
	{ bare: 'الله', canonical: 'اللّٰه', note: 'Allah — shadda + dagger alef on the second lam' },
	{ bare: 'هذا', canonical: 'هٰذا', note: 'this (m.) — dagger alef' },
	{ bare: 'هذه', canonical: 'هٰذه', note: 'this (f.) — dagger alef' },
	{ bare: 'هؤلاء', canonical: 'هٰؤلاء', note: 'these — dagger alef' },
	{ bare: 'ذلك', canonical: 'ذٰلك', note: 'that (m.) — dagger alef' },
	{ bare: 'أولئك', canonical: 'أولٰئك', note: 'those — dagger alef' },
	{ bare: 'لكن', canonical: 'لٰكن', note: 'but — dagger alef' },
	{ bare: 'الرحمن', canonical: 'الرحمٰن', note: 'al-Rahman — dagger alef' },
	{ bare: 'طه', canonical: 'طٰه', note: 'Ta-ha (Surah name) — dagger alef' },
	{ bare: 'يس', canonical: 'يٰس', note: 'Ya-Sin (Surah name) — dagger alef' }
];

export function findVocalizableMatches(text: string): SpellingSubstitution[] {
	const matches: SpellingSubstitution[] = [];
	for(const s of spellings) {
		if(text.includes(s.bare) && !text.includes(s.canonical)) matches.push(s);
	}
	return matches;
}

export function applySpellings(text: string): string {
	let out = text;
	for(const s of spellings) {
		if(out.includes(s.bare) && !out.includes(s.canonical)) {
			out = out.split(s.bare).join(s.canonical);
		}
	}
	return out;
}
