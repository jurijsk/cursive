import type { LetterInfo } from '~/data/letters';

export interface ShapedGlyph {
	glyphId: number;
	glyphName: string | null;
	cluster: number;
	path: string | null;
	x: number;
	y: number;
	xAdvance: number;
	missing: boolean;
}

export interface GlyphCluster {
	cluster: number;
	glyphs: ShapedGlyph[];
}

export interface GlyphSelection {
	glyph: ShapedGlyph;
	sourceText: string;
	letterChar: string | null;
}

/**
 * Group glyphs by their HarfBuzz cluster id, preserving the order in which
 * each cluster first appears in the buffer (visual order for RTL text).
 *
 * Low-level primitive — see {@link groupGlyphsIntoUnits} for the
 * letter-vs-diacritic-aware grouping the SVG actually renders with.
 */
export function groupGlyphsByCluster(glyphs: ShapedGlyph[]): GlyphCluster[] {
	const map = new Map<number, ShapedGlyph[]>();
	const order: number[] = [];
	for(const g of glyphs) {
		if(!map.has(g.cluster)) {
			map.set(g.cluster, []);
			order.push(g.cluster);
		}
		map.get(g.cluster)!.push(g);
	}
	return order.map(c => ({ cluster: c, glyphs: map.get(c)! }));
}

const isMarkChar = (c: string): boolean => /\p{M}/u.test(c);

// Arabic Joining_Type lookup for the letters we care about. Most letters in
// 0621–06FF are dual-joining (D) — they connect on both sides; a small set are
// right-joining only (R) — they accept a connection from the previous letter
// but don't pass one to the next. Hamza (U+0621) is non-joining (U).
// Combining marks and tatweel are transparent (T).
const RIGHT_JOINING_ONLY = new Set([
	0x0622, 0x0623, 0x0624, 0x0625, 0x0627, 0x062F, 0x0630, 0x0631, 0x0632, 0x0648, 0x0671
]);

function joinType(char: string): 'D' | 'R' | 'U' | 'T' {
	if(!char) return 'U';
	if(isMarkChar(char) || char === 'ـ') return 'T';
	const cp = char.codePointAt(0);
	if(cp == null) return 'U';
	if(cp === 0x0621) return 'U';
	if(RIGHT_JOINING_ONLY.has(cp)) return 'R';
	if(cp >= 0x0621 && cp <= 0x06FF) return 'D';
	return 'U';
}

const ZWJ = '‍';

/**
 * Render an Arabic letter in the same contextual form (initial / medial /
 * final / isolated) it has when surrounded by `prevChar` and `nextChar` in a
 * word. ZWJ forces the joining behavior so the font's shaper picks the right
 * form even though we're rendering the letter in isolation (e.g. on a button).
 *
 * Combining marks and tatweel are transparent for joining and should be
 * stripped from the neighbor characters before calling this.
 */
export function letterPreviewInContext(char: string, prevChar: string, nextChar: string): string {
	const me = joinType(char);
	if(me === 'U' || me === 'T') return char;
	const prev = joinType(prevChar);
	const next = joinType(nextChar);
	// joinsFromRight: previous letter passes a connection to the left AND
	// this letter accepts one from the right.
	const joinsFromRight = prev === 'D' && (me === 'D' || me === 'R');
	// joinsToLeft: next letter accepts a connection from the right AND this
	// letter passes one to the left (R letters don't).
	const joinsToLeft = (next === 'D' || next === 'R') && me === 'D';
	if(joinsFromRight && joinsToLeft) return ZWJ + char + ZWJ; // medial
	if(joinsFromRight) return ZWJ + char;                       // final
	if(joinsToLeft) return char + ZWJ;                          // initial
	return char;                                                // isolated
}

/**
 * Look up the nearest non-mark character before `fromIdx` in the input
 * (combining marks are transparent for Arabic joining).
 */
export function findPrevBaseChar(input: string, fromIdx: number): string {
	for(let i = fromIdx - 1;i >= 0;i--) {
		const c = input[i];
		if(c && !isMarkChar(c)) return c;
	}
	return '';
}

/**
 * Look up the nearest non-mark character at or after `fromIdx` in the input.
 */
export function findNextBaseChar(input: string, fromIdx: number): string {
	for(let i = fromIdx;i < input.length;i++) {
		const c = input[i];
		if(c && !isMarkChar(c)) return c;
	}
	return '';
}

/**
 * Group glyphs into "letter units" for hover highlighting. Within a cluster:
 *
 *  - The base glyph (xAdvance > 0) plus any *extra* mark glyphs (font-internal
 *    decorations the font added via ccmp, e.g. Tajawal splitting ب into a
 *    dotless body + a separate dot glyph) form one unit so the whole letter
 *    highlights together.
 *  - Each remaining mark glyph (one corresponding to a real combining-mark
 *    codepoint in the input — fatha, kasra, shadda, dagger alef, etc.) becomes
 *    its own unit so a diacritic doesn't highlight with its base letter.
 *
 * The "extra" marks are detected by counting: extraMarks = markGlyphs.length -
 * markChars.length, where markChars is the set of `\p{M}` characters in the
 * cluster's input span. Buffer order matters here — we assume the font emits
 * decoration marks before the real combining marks (which is what HarfBuzz's
 * default Arabic shaping order produces for the fonts we ship).
 *
 * For unusual cases (multi-base ligatures, merged marks where
 * markGlyphs.length < markChars.length) the cluster falls back to one unit
 * containing everything, which is a safe but less granular default.
 */
export function groupGlyphsIntoUnits(glyphs: ShapedGlyph[], input: string): GlyphCluster[] {
	const units: GlyphCluster[] = [];
	const sortedClusters = [...new Set(glyphs.map(x => x.cluster))].sort((a, b) => a - b);

	// Iterate in reading (input) order — ascending cluster id — so the resulting
	// array walks the word the way it's read. The shaper hands glyphs back in
	// visual / buffer order for RTL text, but cluster ids preserve the input
	// offset, which is what we want for navigation semantics.
	for(let i = 0;i < sortedClusters.length;i++) {
		const cluster = sortedClusters[i]!;
		const end = i < sortedClusters.length - 1 ? sortedClusters[i + 1]! : input.length;
		const clusterChars = Array.from(input.slice(cluster, end));
		const glyphsInCluster = glyphs.filter(g => g.cluster === cluster);
		const baseGlyphs = glyphsInCluster.filter(g => g.xAdvance !== 0);
		const markGlyphs = glyphsInCluster.filter(g => g.xAdvance === 0);
		const baseChars = clusterChars.filter(c => !isMarkChar(c));
		const markChars = clusterChars.filter(c => isMarkChar(c));

		if(baseGlyphs.length === 1 && baseChars.length === 1) {
			// Single base letter with optional font decorations + real diacritics.
			// We need to tell two kinds of mark glyphs apart:
			//   - Real diacritics: produced from a combining-mark codepoint in the
			//     input (fatha, kasra, shadda, etc.). They become their own units
			//     so hovering them doesn't highlight the base letter.
			//   - Font decorations: glyphs the font emits as part of the letter
			//     itself (e.g. Tajawal splits ب into a dotless body + a separate
			//     "dotbelowar" glyph; ج into a haa-shape body + dotbelowar; ة into
			//     a heh-shape body + "twodotshorizontalabovear"). These belong with
			//     the letter unit and shouldn't be selectable separately.
			//
			// Real diacritics are reliably named after the input codepoint they
			// came from (e.g. "uni064E" for fatha), while decorations have
			// font-internal names ("dotbelowar"). When the count matches but no
			// names line up (mocks, unusual fonts, merged marks), we fall back to
			// "all marks are real diacritics" or a buffer-order heuristic.
			const markCharCodepoints = new Set(markChars.map(c => c.codePointAt(0)));
			const extractCp = (g: ShapedGlyph): number | null => {
				if(!g.glyphName) return null;
				const m = /^uni([0-9A-Fa-f]{4,6})$/.exec(g.glyphName);
				return m ? parseInt(m[1]!, 16) : null;
			};
			const nameMatched = markGlyphs.filter(g => {
				const cp = extractCp(g);
				return cp != null && markCharCodepoints.has(cp);
			});

			let isReal: (g: ShapedGlyph) => boolean;
			if(markGlyphs.length <= markChars.length) {
				// No room for decorations; every mark glyph is a real diacritic
				// (possibly merged when count is strictly less).
				isReal = () => true;
			} else if(nameMatched.length === markChars.length) {
				// Name-matching cleanly identifies all real diacritics.
				const realSet = new Set(nameMatched);
				isReal = (g) => realSet.has(g);
			} else {
				// Fallback for fonts/mocks without uniXXXX naming: assume the first
				// (markGlyphs - markChars) marks in buffer order are decorations.
				const extraMarks = markGlyphs.length - markChars.length;
				const realByIndex = new Set(markGlyphs.slice(extraMarks));
				isReal = (g) => realByIndex.has(g);
			}

			const letterUnitGlyphs: ShapedGlyph[] = [];
			const diacriticUnits: GlyphCluster[] = [];
			for(const g of glyphsInCluster) {
				if(g.xAdvance !== 0) letterUnitGlyphs.push(g);
				else if(isReal(g)) diacriticUnits.push({ cluster, glyphs: [g] });
				else letterUnitGlyphs.push(g);
			}
			units.push({ cluster, glyphs: letterUnitGlyphs });
			units.push(...diacriticUnits);
		} else {
			// Ligature, merged base shaping, or other unusual case — keep the cluster as one unit.
			units.push({ cluster, glyphs: glyphsInCluster });
		}
	}

	return units;
}

/**
 * Resolve a clicked glyph back to the source character(s) it represents
 * in the original input string, plus the primary letter to look up.
 *
 * Cluster ids identify the input character offset where this glyph
 * originated. For RTL text the buffer is in visual order so consecutive
 * glyphs may have decreasing cluster ids; we find the next *larger*
 * cluster id (across the whole array) to determine where this cluster's
 * char span ends.
 *
 * Within a cluster, glyphs are partitioned by xAdvance (marks have
 * advance=0) and chars by Unicode mark category (\p{M}). When base/mark
 * counts match, glyphs map 1:1 to chars in their own group's order.
 * Otherwise we fall back to "ligature / merged shaping" semantics: the
 * source text is the whole cluster span and the letter is the first base
 * char that has a letters-table entry.
 */
export function resolveGlyphSelection(
	glyph: ShapedGlyph,
	allGlyphs: ShapedGlyph[],
	input: string,
	letters: Record<string, LetterInfo>
): GlyphSelection {
	// Re-find the glyph in the current array — caller may pass a stale ref
	// after a refetch replaced the glyphs array with new instances.
	const g = allGlyphs.find(x => x.cluster === glyph.cluster && x.glyphId === glyph.glyphId) ?? glyph;
	const start = g.cluster;
	const allClusters = [...new Set(allGlyphs.map(x => x.cluster))].sort((a, b) => a - b);
	const i = allClusters.indexOf(start);
	const end = i >= 0 && i < allClusters.length - 1 ? allClusters[i + 1]! : input.length;

	const clusterChars = Array.from(input.slice(start, end));
	const glyphsInCluster = allGlyphs.filter(x => x.cluster === start);
	const baseGlyphs = glyphsInCluster.filter(x => x.xAdvance !== 0);
	const markGlyphs = glyphsInCluster.filter(x => x.xAdvance === 0);
	const baseChars = clusterChars.filter(c => !isMarkChar(c));
	const markChars = clusterChars.filter(c => isMarkChar(c));

	let sourceText: string;
	let primaryChar: string | null;
	// For mark-glyph clicks, distinguish a real diacritic (a glyph produced
	// from a combining-mark codepoint in the input — name like "uni064E") from
	// a font decoration that's just part of the base letter ("dotbelowar",
	// "twodotshorizontalabovear", etc.). A click on a decoration should
	// resolve to the base letter, not to the cluster's diacritics.
	const markCharCps = new Set(markChars.map(c => c.codePointAt(0)));
	const glyphCp = (() => {
		if(!g.glyphName) return null;
		const m = /^uni([0-9A-Fa-f]{4,6})$/.exec(g.glyphName);
		return m ? parseInt(m[1]!, 16) : null;
	})();
	const isRealDiacriticByName = glyphCp != null && markCharCps.has(glyphCp);

	if(g.xAdvance === 0 && isRealDiacriticByName && glyphCp != null) {
		// Direct match by codepoint — fastest path, works regardless of order.
		sourceText = String.fromCodePoint(glyphCp);
		primaryChar = sourceText || null;
	} else if(g.xAdvance === 0 && markGlyphs.length > markChars.length && markChars.length > 0) {
		// More mark glyphs than mark chars and this one didn't name-match —
		// it's a font decoration, resolve to the base letter (the one this
		// decoration belongs to), not to a diacritic in the cluster.
		sourceText = baseChars.join('') || clusterChars.join('');
		primaryChar = baseChars[0] ?? clusterChars[0] ?? null;
	} else if(g.xAdvance === 0 && markGlyphs.length === markChars.length && markChars.length > 0) {
		// 1:1 by buffer order — used when names don't follow uniXXXX (mocks /
		// unusual fonts) but the counts line up.
		const idx = markGlyphs.indexOf(g);
		sourceText = idx >= 0 ? (markChars[idx] ?? '') : '';
		primaryChar = sourceText || null;
	} else if(g.xAdvance === 0 && markChars.length > 0) {
		// Font merged multiple marks into one (e.g. Tajawal shadda+dagger-alef).
		sourceText = markChars.join('');
		primaryChar = markChars.find(c => letters[c]) ?? markChars[0] ?? null;
	} else if(g.xAdvance !== 0 && baseGlyphs.length === baseChars.length && baseChars.length > 0) {
		const idx = baseGlyphs.indexOf(g);
		sourceText = idx >= 0 ? (baseChars[idx] ?? '') : '';
		primaryChar = sourceText || null;
	} else {
		// Ligature or merged base shaping, OR a font glyph that's part of a
		// multi-glyph letter unit (e.g. Tajawal's ب dot — markGlyphs > markChars
		// because the font added a decoration). Show the whole cluster span and
		// pick the first base letter that has a letters-table entry.
		sourceText = clusterChars.join('');
		primaryChar = clusterChars.find(c => letters[c]) ?? clusterChars[0] ?? null;
	}
	return { glyph: g, sourceText, letterChar: primaryChar };
}
