import { describe, expect, it } from 'vitest';
import { groupGlyphsByCluster, groupGlyphsIntoUnits, resolveGlyphSelection, type ShapedGlyph } from '~/utils/glyphs';
import type { LetterInfo } from '~/data/letters';

const baseGlyph: ShapedGlyph = {
	glyphId: 0,
	glyphName: null,
	cluster: 0,
	path: 'M0,0',
	x: 0,
	y: 0,
	xAdvance: 100,
	missing: false
};
const make = (overrides: Partial<ShapedGlyph>): ShapedGlyph => ({ ...baseGlyph, ...overrides });

// Minimal letters table covering chars used in tests.
const letters: Record<string, LetterInfo> = {
	'ب': { char: 'ب', name: 'baa', arabicName: 'باء', transliteration: ['b'], pronunciation: { palestinian: { ipa: '/b/', description: '', englishExamples: [] }, lebanese: { ipa: '/b/', description: '', englishExamples: [] } } },
	'ل': { char: 'ل', name: 'laam', arabicName: 'لام', transliteration: ['l'], pronunciation: { palestinian: { ipa: '/l/', description: '', englishExamples: [] }, lebanese: { ipa: '/l/', description: '', englishExamples: [] } } },
	'ا': { char: 'ا', name: 'alif', arabicName: 'ألف', transliteration: ['a'], pronunciation: { palestinian: { ipa: '/aː/', description: '', englishExamples: [] }, lebanese: { ipa: '/aː/', description: '', englishExamples: [] } } },
	'ه': { char: 'ه', name: 'haa', arabicName: 'هاء', transliteration: ['h'], pronunciation: { palestinian: { ipa: '/h/', description: '', englishExamples: [] }, lebanese: { ipa: '/h/', description: '', englishExamples: [] } } },
	'م': { char: 'م', name: 'miim', arabicName: 'ميم', transliteration: ['m'], pronunciation: { palestinian: { ipa: '/m/', description: '', englishExamples: [] }, lebanese: { ipa: '/m/', description: '', englishExamples: [] } } },
	'ر': { char: 'ر', name: 'raa', arabicName: 'راء', transliteration: ['r'], pronunciation: { palestinian: { ipa: '/r/', description: '', englishExamples: [] }, lebanese: { ipa: '/r/', description: '', englishExamples: [] } } },
	'ح': { char: 'ح', name: 'Haa', arabicName: 'حاء', transliteration: ['H'], pronunciation: { palestinian: { ipa: '/ħ/', description: '', englishExamples: [] }, lebanese: { ipa: '/ħ/', description: '', englishExamples: [] } } },
	'ج': { char: 'ج', name: 'jiim', arabicName: 'جيم', transliteration: ['j'], pronunciation: { palestinian: { ipa: '/ʒ/', description: '', englishExamples: [] }, lebanese: { ipa: '/ʒ/', description: '', englishExamples: [] } } },
	'ّ': { char: 'ّ', name: 'shadda', arabicName: 'شَدّة', kind: 'diacritic', transliteration: [''], pronunciation: { palestinian: { ipa: 'ː', description: '', englishExamples: [] }, lebanese: { ipa: 'ː', description: '', englishExamples: [] } } },
	'ٰ': { char: 'ٰ', name: 'dagger alef', arabicName: 'ألف خنجرية', kind: 'diacritic', transliteration: ['a'], pronunciation: { palestinian: { ipa: '/aː/', description: '', englishExamples: [] }, lebanese: { ipa: '/aː/', description: '', englishExamples: [] } } },
	'َ': { char: 'َ', name: 'fatha', arabicName: 'فَتْحة', kind: 'diacritic', transliteration: ['a'], pronunciation: { palestinian: { ipa: '/a/', description: '', englishExamples: [] }, lebanese: { ipa: '/a/', description: '', englishExamples: [] } } }
};

describe('groupGlyphsByCluster', () => {
	it('returns an empty list for no glyphs', () => {
		expect(groupGlyphsByCluster([])).toEqual([]);
	});

	it('keeps a single-glyph-per-cluster word as one group per glyph', () => {
		// "حبا" — three letters, each in its own cluster, single glyph each.
		const glyphs: ShapedGlyph[] = [
			make({ glyphId: 1, cluster: 2, glyphName: 'alefFinal' }),  // ا (visual position 0, RTL)
			make({ glyphId: 2, cluster: 1, glyphName: 'baaMedial' }),  // ب
			make({ glyphId: 3, cluster: 0, glyphName: 'haaInitial' })  // ح
		];
		const groups = groupGlyphsByCluster(glyphs);
		expect(groups.map(g => g.cluster)).toEqual([2, 1, 0]);
		expect(groups.map(g => g.glyphs.length)).toEqual([1, 1, 1]);
	});

	it('groups multiple glyphs sharing a cluster together (font-decomposed letter)', () => {
		// Tajawal-style decomposition of ب in "مرحبا": body + separate dot glyph
		// at the same cluster id. Other letters render as single glyphs.
		const glyphs: ShapedGlyph[] = [
			make({ glyphId: 1, cluster: 4, glyphName: 'uniFE8E' }),                    // ا
			make({ glyphId: 2, cluster: 3, glyphName: 'dotbelowar', xAdvance: 0 }),    // ب dot (mark)
			make({ glyphId: 3, cluster: 3, glyphName: 'uni066E.medi', xAdvance: 100 }),// ب body
			make({ glyphId: 4, cluster: 2, glyphName: 'uni062D.init' }),               // ح
			make({ glyphId: 5, cluster: 1, glyphName: 'uni0631.fina' }),               // ر
			make({ glyphId: 6, cluster: 0, glyphName: 'uni0645.init' })                // م
		];
		const groups = groupGlyphsByCluster(glyphs);
		expect(groups).toHaveLength(5);
		const baaGroup = groups.find(g => g.cluster === 3)!;
		expect(baaGroup.glyphs).toHaveLength(2);
		expect(baaGroup.glyphs.map(g => g.glyphName)).toEqual(['dotbelowar', 'uni066E.medi']);
	});

	it('preserves visual buffer order across clusters (RTL)', () => {
		// groupGlyphsByCluster is the low-level primitive that keeps buffer order.
		const glyphs: ShapedGlyph[] = [
			make({ glyphId: 1, cluster: 4 }),
			make({ glyphId: 2, cluster: 3 }),
			make({ glyphId: 3, cluster: 0 }),
			make({ glyphId: 4, cluster: 2 })
		];
		expect(groupGlyphsByCluster(glyphs).map(g => g.cluster)).toEqual([4, 3, 0, 2]);
	});

	it('preserves the order glyphs appear in within a cluster', () => {
		const glyphs: ShapedGlyph[] = [
			make({ glyphId: 1, cluster: 0, xAdvance: 0, glyphName: 'mark1' }),
			make({ glyphId: 2, cluster: 0, xAdvance: 100, glyphName: 'base' }),
			make({ glyphId: 3, cluster: 0, xAdvance: 0, glyphName: 'mark2' })
		];
		const [g] = groupGlyphsByCluster(glyphs);
		expect(g!.glyphs.map(x => x.glyphName)).toEqual(['mark1', 'base', 'mark2']);
	});
});

describe('groupGlyphsIntoUnits', () => {
	it('one unit per letter when no font decorations or diacritics are involved', () => {
		// "حبا" — 3 single-glyph clusters.
		const glyphs: ShapedGlyph[] = [
			make({ glyphId: 1, cluster: 2, xAdvance: 100 }),
			make({ glyphId: 2, cluster: 1, xAdvance: 100 }),
			make({ glyphId: 3, cluster: 0, xAdvance: 100 })
		];
		const units = groupGlyphsIntoUnits(glyphs, 'حبا');
		expect(units).toHaveLength(3);
		expect(units.map(u => u.glyphs.length)).toEqual([1, 1, 1]);
	});

	it('keeps font-internal decorations (Tajawal ب dot) with the letter unit', () => {
		// "مرحبا" with Tajawal-style decomposition of ب: body + dot at cluster 3.
		// No diacritic chars in input, so the extra mark glyph counts as font decoration.
		const glyphs: ShapedGlyph[] = [
			make({ glyphId: 1, cluster: 4, xAdvance: 100 }),                               // ا
			make({ glyphId: 2, cluster: 3, xAdvance: 0, glyphName: 'dotbelowar' }),         // dot
			make({ glyphId: 3, cluster: 3, xAdvance: 100, glyphName: 'uni066E.medi' }),    // body
			make({ glyphId: 4, cluster: 2, xAdvance: 100 }),                               // ح
			make({ glyphId: 5, cluster: 1, xAdvance: 100 }),                               // ر
			make({ glyphId: 6, cluster: 0, xAdvance: 100 })                                // م
		];
		const units = groupGlyphsIntoUnits(glyphs, 'مرحبا');
		expect(units).toHaveLength(5);
		const baaUnit = units.find(u => u.cluster === 3)!;
		expect(baaUnit.glyphs.map(g => g.glyphName)).toEqual(['dotbelowar', 'uni066E.medi']);
	});

	it('splits real diacritic glyphs into their own units (lam + shadda + dagger alef)', () => {
		// Cluster has 1 base + 2 mark glyphs (1:1 with markChars). With diacritic-
		// before-consonant ordering the diacritics come first.
		const glyphs: ShapedGlyph[] = [
			make({ glyphId: 1, cluster: 0, xAdvance: 100, glyphName: 'lam' }),
			make({ glyphId: 2, cluster: 0, xAdvance: 0, glyphName: 'shadda' }),
			make({ glyphId: 3, cluster: 0, xAdvance: 0, glyphName: 'daggerAlef' })
		];
		const units = groupGlyphsIntoUnits(glyphs, 'لّٰ');
		expect(units).toHaveLength(3);
		expect(units[0]!.glyphs.map(g => g.glyphName)).toEqual(['lam']);
		expect(units[1]!.glyphs.map(g => g.glyphName)).toEqual(['shadda']);
		expect(units[2]!.glyphs.map(g => g.glyphName)).toEqual(['daggerAlef']);
	});

	it('identifies real diacritics by glyph-name codepoint, not buffer order', () => {
		// Tajawal at "جَمِيلَةٌ" cluster 0 emits the fatha BEFORE the dot in
		// buffer order: [fatha (uni064E), body (uni062D.init), dotbelowar].
		// Naive "first mark is the decoration" would put the fatha in the
		// letter unit. Glyph-name codepoint matching against input mark chars
		// correctly classifies fatha as the real diacritic.
		const glyphs: ShapedGlyph[] = [
			make({ glyphId: 1, cluster: 0, xAdvance: 0, glyphName: 'uni064E' }),
			make({ glyphId: 2, cluster: 0, xAdvance: 100, glyphName: 'uni062D.init' }),
			make({ glyphId: 3, cluster: 0, xAdvance: 0, glyphName: 'dotbelowar' })
		];
		const units = groupGlyphsIntoUnits(glyphs, 'جَ');
		expect(units).toHaveLength(2);
		// Input order: letter unit (body + font-decoration dot) before its diacritic.
		expect(units[0]!.glyphs.map(g => g.glyphName)).toEqual(['uni062D.init', 'dotbelowar']);
		expect(units[1]!.glyphs.map(g => g.glyphName)).toEqual(['uni064E']);
	});

	it('separates a real diacritic from a font-decorated letter (ب + fatha)', () => {
		// Input "بَ": 1 base char + 1 mark char. With Tajawal-style decomposition
		// of ب the cluster has 1 base glyph + 2 mark glyphs (dot + fatha).
		// Decoration goes with the letter; fatha becomes its own unit (first).
		const glyphs: ShapedGlyph[] = [
			make({ glyphId: 1, cluster: 0, xAdvance: 0, glyphName: 'dot' }),       // decoration
			make({ glyphId: 2, cluster: 0, xAdvance: 100, glyphName: 'baaBody' }), // base
			make({ glyphId: 3, cluster: 0, xAdvance: 0, glyphName: 'fatha' })      // diacritic
		];
		const units = groupGlyphsIntoUnits(glyphs, 'بَ');
		expect(units).toHaveLength(2);
		expect(units[0]!.glyphs.map(g => g.glyphName)).toEqual(['dot', 'baaBody']);
		expect(units[1]!.glyphs.map(g => g.glyphName)).toEqual(['fatha']);
	});

	it('splits a merged-mark glyph from its base letter into its own unit', () => {
		// Tajawal merges shadda+dagger alef into a single FC63 glyph at cluster 2
		// of اللّٰه (markGlyphs=1 < markChars=2). The merged glyph is still a
		// real diacritic and shouldn't share a unit with the lam — otherwise
		// hovering the diacritic would also highlight the letter.
		const glyphs: ShapedGlyph[] = [
			make({ glyphId: 1, cluster: 5, xAdvance: 100, glyphName: 'haaFinal' }),
			make({ glyphId: 2, cluster: 2, xAdvance: 0, glyphName: 'mergedDiacritic' }),
			make({ glyphId: 3, cluster: 2, xAdvance: 100, glyphName: 'lamMedial' }),
			make({ glyphId: 4, cluster: 1, xAdvance: 100, glyphName: 'lamInitial' }),
			make({ glyphId: 5, cluster: 0, xAdvance: 100, glyphName: 'alif' })
		];
		const units = groupGlyphsIntoUnits(glyphs, 'اللّٰه');
		// 4 base clusters (alif, lam-init, lam-med, heh) + 1 split-off diacritic = 5.
		expect(units).toHaveLength(5);
		const cluster2Units = units.filter(u => u.cluster === 2);
		expect(cluster2Units).toHaveLength(2);
		// Input order: letter first, then the merged diacritic.
		expect(cluster2Units[0]!.glyphs.map(g => g.glyphName)).toEqual(['lamMedial']);
		expect(cluster2Units[1]!.glyphs.map(g => g.glyphName)).toEqual(['mergedDiacritic']);
	});

	it('iterates clusters in reading order regardless of buffer order', () => {
		// Buffer is in visual LTR order (clusters 4,3,0 for an RTL word) but
		// groupGlyphsIntoUnits emits in reading order (ascending cluster id).
		const glyphs: ShapedGlyph[] = [
			make({ glyphId: 1, cluster: 4, xAdvance: 100 }),
			make({ glyphId: 2, cluster: 3, xAdvance: 100 }),
			make({ glyphId: 3, cluster: 0, xAdvance: 100 })
		];
		const units = groupGlyphsIntoUnits(glyphs, 'مرحبا');
		expect(units.map(u => u.cluster)).toEqual([0, 3, 4]);
	});

	it('within a cluster, letter unit comes before diacritic unit (reading order)', () => {
		// Real diacritic identified by codepoint matching against input mark chars.
		const glyphs: ShapedGlyph[] = [
			make({ glyphId: 1, cluster: 0, xAdvance: 0, glyphName: 'uni064E' }),  // fatha
			make({ glyphId: 2, cluster: 0, xAdvance: 100, glyphName: 'baaBody' }) // body
		];
		const units = groupGlyphsIntoUnits(glyphs, 'بَ');
		expect(units).toHaveLength(2);
		expect(units[0]!.glyphs.map(g => g.glyphName)).toEqual(['baaBody']);
		expect(units[1]!.glyphs.map(g => g.glyphName)).toEqual(['uni064E']);
	});

	it('emits multi-letter input in reading order: jiim → fatha → miim → kasra', () => {
		// Mock of "جَمِ" with each cluster's glyphs. Buffer order is irrelevant here;
		// groupGlyphsIntoUnits should return units in reading (input) order.
		const glyphs: ShapedGlyph[] = [
			// Buffer (visual LTR) order: cluster 2 (mim) first since it's leftmost,
			// then cluster 0 (jiim).
			make({ glyphId: 1, cluster: 2, xAdvance: 0, glyphName: 'uni0650' }),  // kasra
			make({ glyphId: 2, cluster: 2, xAdvance: 100, glyphName: 'uni0645' }),// mim
			make({ glyphId: 3, cluster: 0, xAdvance: 0, glyphName: 'uni064E' }),  // fatha
			make({ glyphId: 4, cluster: 0, xAdvance: 100, glyphName: 'uni062C' }) // jiim
		];
		const units = groupGlyphsIntoUnits(glyphs, 'جَمِ');
		expect(units.map(u => u.glyphs[0]!.glyphName)).toEqual([
			'uni062C', // jiim (letter, cluster 0)
			'uni064E', // fatha (cluster 0 diacritic)
			'uni0645', // mim (letter, cluster 2)
			'uni0650'  // kasra (cluster 2 diacritic)
		]);
	});
});

describe('resolveGlyphSelection', () => {
	it('maps a clicked base glyph to its single source character', () => {
		// Input "حبا"; click the alef glyph (cluster 2, visual position 0).
		const glyphs: ShapedGlyph[] = [
			make({ glyphId: 1, cluster: 2, xAdvance: 100 }),
			make({ glyphId: 2, cluster: 1, xAdvance: 100 }),
			make({ glyphId: 3, cluster: 0, xAdvance: 100 })
		];
		const sel = resolveGlyphSelection(glyphs[0]!, glyphs, 'حبا', letters);
		expect(sel.sourceText).toBe('ا');
		expect(sel.letterChar).toBe('ا');
	});

	it('resolves a font-decoration mark click to the base letter (jiim dot)', () => {
		// Tajawal renders ج at cluster 0 of e.g. "جَ" as 3 glyphs in buffer
		// order: fatha (uni064E real diacritic), body (uni062D.init base),
		// dotbelowar (font decoration). markGlyphs > markChars and the dot's
		// name doesn't match a Unicode mark codepoint, so it resolves to ج.
		const glyphs: ShapedGlyph[] = [
			make({ glyphId: 1, cluster: 0, xAdvance: 0, glyphName: 'uni064E' }),
			make({ glyphId: 2, cluster: 0, xAdvance: 100, glyphName: 'uni062D.init' }),
			make({ glyphId: 3, cluster: 0, xAdvance: 0, glyphName: 'dotbelowar' })
		];
		const dot = glyphs[2]!;
		const fatha = glyphs[0]!;
		expect(resolveGlyphSelection(dot, glyphs, 'جَ', letters).letterChar).toBe('ج');
		// And clicking the actual fatha still resolves to the fatha mark.
		expect(resolveGlyphSelection(fatha, glyphs, 'جَ', letters).letterChar).toBe('َ');
	});

	it('maps a multi-glyph letter (font-decomposed ب) to the base letter', () => {
		// Tajawal's ب in "مرحبا" splits into body + dot at the same cluster.
		// Clicking either should resolve to ب — the dot has no Unicode source
		// (markChars is empty), so the selection logic falls through to the
		// "ligature / merged shaping" branch that returns the cluster span
		// and picks the first letter-table entry.
		const glyphs: ShapedGlyph[] = [
			make({ glyphId: 1, cluster: 4, xAdvance: 100 }),
			make({ glyphId: 2, cluster: 3, xAdvance: 0, glyphName: 'dot' }),
			make({ glyphId: 3, cluster: 3, xAdvance: 100, glyphName: 'body' }),
			make({ glyphId: 4, cluster: 2, xAdvance: 100 }),
			make({ glyphId: 5, cluster: 1, xAdvance: 100 }),
			make({ glyphId: 6, cluster: 0, xAdvance: 100 })
		];
		const dot = glyphs[1]!;
		const body = glyphs[2]!;
		expect(resolveGlyphSelection(dot, glyphs, 'مرحبا', letters).letterChar).toBe('ب');
		expect(resolveGlyphSelection(body, glyphs, 'مرحبا', letters).letterChar).toBe('ب');
	});

	it('resolves a diacritic glyph to its mark character (1:1 case)', () => {
		// Input "بَ" — base + diacritic, font produces 2 glyphs at the same
		// cluster (1 base, 1 mark). Click the fatha glyph; resolution should
		// pick the mark char (fatha) by 1:1 mapping.
		const glyphs: ShapedGlyph[] = [
			make({ glyphId: 1, cluster: 0, xAdvance: 100, glyphName: 'baa' }),
			make({ glyphId: 2, cluster: 0, xAdvance: 0, glyphName: 'fatha' })
		];
		const fatha = glyphs[1]!;
		const sel = resolveGlyphSelection(fatha, glyphs, 'بَ', letters);
		expect(sel.sourceText).toBe('َ');
		expect(sel.letterChar).toBe('َ');
	});

	it('resolves a base glyph in a base+mark cluster to the base char', () => {
		const glyphs: ShapedGlyph[] = [
			make({ glyphId: 1, cluster: 0, xAdvance: 100, glyphName: 'baa' }),
			make({ glyphId: 2, cluster: 0, xAdvance: 0, glyphName: 'fatha' })
		];
		const baa = glyphs[0]!;
		const sel = resolveGlyphSelection(baa, glyphs, 'بَ', letters);
		expect(sel.sourceText).toBe('ب');
		expect(sel.letterChar).toBe('ب');
	});

	it('resolves a merged-mark glyph (font merged shadda+dagger alef) to a diacritic', () => {
		// Tajawal renders shadda+dagger-alef on the second lam in اللّٰه as a
		// single glyph (uniFC63). The cluster contains 1 base + 1 mark glyph
		// but the input has 1 base + 2 mark chars; resolution should pick a
		// mark char (not fall back to the base letter).
		const glyphs: ShapedGlyph[] = [
			make({ glyphId: 1, cluster: 5, xAdvance: 100, glyphName: 'haaFinal' }),
			make({ glyphId: 2, cluster: 2, xAdvance: 0, glyphName: 'mergedDiacritic' }),
			make({ glyphId: 3, cluster: 2, xAdvance: 100, glyphName: 'lamMedial' }),
			make({ glyphId: 4, cluster: 1, xAdvance: 100, glyphName: 'lamInitial' }),
			make({ glyphId: 5, cluster: 0, xAdvance: 100, glyphName: 'alif' })
		];
		const merged = glyphs[1]!;
		const sel = resolveGlyphSelection(merged, glyphs, 'اللّٰه', letters);
		// Shadda is the first mark in the cluster's char span and has a
		// letters-table entry, so it's selected as the primary.
		expect(sel.letterChar).toBe('ّ');
		expect(sel.sourceText).toContain('ّ');
		expect(sel.sourceText).toContain('ٰ');
	});

	it('falls through to the ligature branch when nothing else matches', () => {
		// Two base chars sharing one cluster (a hypothetical ligature glyph).
		const glyphs: ShapedGlyph[] = [
			make({ glyphId: 1, cluster: 0, xAdvance: 200, glyphName: 'ligature' })
		];
		const sel = resolveGlyphSelection(glyphs[0]!, glyphs, 'لا', letters);
		expect(sel.sourceText).toBe('لا');
		expect(sel.letterChar).toBe('ل');
	});

	it('returns a non-empty selection even when caller passes a stale glyph instance', () => {
		// Simulate the post-refresh case: caller holds a glyph object that's
		// no longer in the current array. The function should still resolve
		// by matching cluster + glyphId structurally.
		const stored: ShapedGlyph = make({ glyphId: 42, cluster: 1, xAdvance: 100 });
		const refreshed: ShapedGlyph[] = [
			make({ glyphId: 99, cluster: 0, xAdvance: 100 }),
			make({ glyphId: 42, cluster: 1, xAdvance: 100 }),
			make({ glyphId: 7, cluster: 2, xAdvance: 100 })
		];
		const sel = resolveGlyphSelection(stored, refreshed, 'ابح', letters);
		expect(sel.sourceText).toBe('ب');
		expect(sel.letterChar).toBe('ب');
	});
});
