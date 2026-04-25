import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { HarfBuzzAPI, Font } from 'harfbuzzjs/hbjs';

export interface ShapedGlyph {
	glyphId: number;
	path: string | null;
	x: number;
	y: number;
	xAdvance: number;
	missing: boolean;
}

export interface ShapeResult {
	font: string;
	upem: number;
	hasMissingGlyphs: boolean;
	glyphs: ShapedGlyph[];
}

interface FontMeta {
	key: string;
	file: string;
}

const FONTS: FontMeta[] = [
	{ key: 'tajawal', file: 'Tajawal-Regular.ttf' },
	{ key: 'amiri', file: 'Amiri-Regular.ttf' },
	{ key: 'noto-naskh', file: 'NotoNaskhArabic-Regular.ttf' },
	{ key: 'reem-kufi', file: 'ReemKufi-Regular.ttf' }
];

export const DEFAULT_FONT_KEY = 'tajawal';

interface HbState {
	harfbuzz: HarfBuzzAPI;
	fonts: Map<string, { font: Font; upem: number; }>;
}

declare global {
	// pin to globalThis so the singleton survives Nitro HMR in dev
	// eslint-disable-next-line no-var
	var __hbState: Promise<HbState> | undefined;
}

async function init(): Promise<HbState> {
	const hbMod = await import('harfbuzzjs/hb');
	const hbjsMod = await import('harfbuzzjs/hbjs');
	const factory = (hbMod.default ?? hbMod) as typeof import('harfbuzzjs/hb').default;
	const wrap = (hbjsMod.default ?? hbjsMod) as typeof import('harfbuzzjs/hbjs').default;

	const runtime = await factory();
	const harfbuzz = wrap(runtime);

	const fonts = new Map<string, { font: Font; upem: number; }>();
	for(const meta of FONTS) {
		const fontPath = join(process.cwd(), 'public', 'fonts', meta.file);
		const buf = await readFile(fontPath);
		const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
		const blob = harfbuzz.createBlob(ab);
		const face = harfbuzz.createFace(blob, 0);
		const font = harfbuzz.createFont(face);
		const upem = face.upem ?? face.getUnitsPerEM?.() ?? 1000;
		fonts.set(meta.key, { font, upem });
	}

	return { harfbuzz, fonts };
}

function getHb(): Promise<HbState> {
	if(!globalThis.__hbState) {
		globalThis.__hbState = init();
	}
	return globalThis.__hbState;
}

export async function shapeText(text: string, fontKey?: string): Promise<ShapeResult> {
	const { harfbuzz, fonts } = await getHb();
	const resolvedKey = fontKey && fonts.has(fontKey) ? fontKey : DEFAULT_FONT_KEY;
	const { font, upem } = fonts.get(resolvedKey)!;

	const buf = harfbuzz.createBuffer();
	buf.addText((text ?? '').normalize('NFC'));
	buf.guessSegmentProperties();
	harfbuzz.shape(font, buf);
	const out = buf.json();

	const glyphs: ShapedGlyph[] = [];
	let xCursor = 0;
	let hasMissingGlyphs = false;
	for(const g of out) {
		const missing = g.g === 0;
		if(missing) hasMissingGlyphs = true;
		let path: string | null = null;
		try { path = font.glyphToPath(g.g); } catch { path = null; }
		glyphs.push({
			glyphId: g.g,
			path,
			x: xCursor + g.dx,
			y: g.dy,
			xAdvance: g.ax,
			missing
		});
		xCursor += g.ax;
	}
	buf.destroy();
	return { font: resolvedKey, upem, hasMissingGlyphs, glyphs };
}
