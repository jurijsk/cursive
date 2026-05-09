import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import initHarfBuzz from 'harfbuzzjs/hb';
import createharfBuzzWrap, { type Font, type HarfBuzzAPI } from 'harfbuzzjs/hbjs';
import { letters } from '~/data/letters';
import { groupGlyphsIntoUnits, resolveGlyphSelection, type ShapedGlyph } from '~/utils/glyphs';

interface LoadedFont {
	font: Font;
	upem: number;
}

const TARGET_TEXT = 'جَمِيلَةٌ';
const FONT_FILES = {
	tajawal: 'Tajawal-Regular.ttf',
	amiri: 'Amiri-Regular.ttf',
	'noto-naskh': 'NotoNaskhArabic-Regular.ttf',
	'reem-kufi': 'ReemKufi-Regular.ttf'
} as const;

const FONT_KEYS = Object.keys(FONT_FILES) as Array<keyof typeof FONT_FILES>;
const EXPECTED_SEQUENCE = Array.from(TARGET_TEXT);

let harfbuzz: HarfBuzzAPI;
let loadedFonts: Record<string, LoadedFont>;

function toArrayBuffer(value: Uint8Array): ArrayBuffer {
	return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
}

async function shapeForFont(fontKey: keyof typeof FONT_FILES): Promise<ShapedGlyph[]> {
	const loaded = loadedFonts[fontKey];
	if(!loaded) throw new Error(`font not loaded: ${fontKey}`);

	const buf = harfbuzz.createBuffer();
	buf.addText(TARGET_TEXT.normalize('NFC'));
	buf.guessSegmentProperties();
	harfbuzz.shape(loaded.font, buf, '-liga,-rlig,-dlig');

	const out = buf.json();
	const glyphs: ShapedGlyph[] = [];
	let xCursor = 0;
	for(const g of out) {
		let glyphName: string | null = null;
		try { glyphName = loaded.font.glyphName(g.g); } catch { glyphName = null; }
		glyphs.push({
			glyphId: g.g,
			glyphName,
			cluster: g.cl,
			path: null,
			x: xCursor + g.dx,
			y: g.dy,
			xAdvance: g.ax,
			missing: g.g === 0
		});
		xCursor += g.ax;
	}

	buf.destroy();
	return glyphs;
}

function toLetterSequence(glyphs: ShapedGlyph[]): string[] {
	const units = groupGlyphsIntoUnits(glyphs, TARGET_TEXT);
	const sequence: string[] = [];
	for(const unit of units) {
		const first = unit.glyphs[0];
		if(!first) continue;
		const selection = resolveGlyphSelection(first, glyphs, TARGET_TEXT, letters);
		if(selection.letterChar) sequence.push(selection.letterChar);
	}
	return sequence;
}

beforeAll(async () => {
	const hbWasm = await readFile(join(process.cwd(), 'public', 'hb.wasm'));
	const hbRaw = await initHarfBuzz({ wasmBinary: toArrayBuffer(hbWasm) });
	harfbuzz = createharfBuzzWrap(hbRaw);

	loadedFonts = {};
	for(const [fontKey, fileName] of Object.entries(FONT_FILES)) {
		const fontBytes = await readFile(join(process.cwd(), 'public', 'fonts', fileName));
		const blob = harfbuzz.createBlob(toArrayBuffer(fontBytes));
		const face = harfbuzz.createFace(blob, 0);
		const font = harfbuzz.createFont(face);
		const upem = face.upem ?? face.getUnitsPerEM?.() ?? 1000;
		loadedFonts[fontKey] = { font, upem };
	}
});

describe('shaping sequence consistency across fonts', () => {
	it('produces the expected letter/diacritic sequence for each supported font', async () => {
		for(const fontKey of FONT_KEYS) {
			const glyphs = await shapeForFont(fontKey);
			const sequence = toLetterSequence(glyphs);
			expect(sequence, `font=${fontKey}`).toEqual(EXPECTED_SEQUENCE);
		}
	});

	it('produces identical sequence across all supported fonts', async () => {
		const sequences: Record<string, string[]> = {};
		for(const fontKey of FONT_KEYS) {
			const glyphs = await shapeForFont(fontKey);
			sequences[fontKey] = toLetterSequence(glyphs);
		}

		const baseline = sequences[FONT_KEYS[0]];
		for(const fontKey of FONT_KEYS.slice(1)) {
			expect(sequences[fontKey], `baseline=${FONT_KEYS[0]}, font=${fontKey}`).toEqual(baseline);
		}
	});
});