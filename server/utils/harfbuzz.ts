import { useStorage } from 'nitropack/runtime';
import type { HarfBuzzAPI, Font } from 'harfbuzzjs/hbjs';

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

function toArrayBuffer(value: unknown): ArrayBuffer {
	if(value instanceof ArrayBuffer) return value;
	if(value instanceof Uint8Array) return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
	throw new Error('expected ArrayBuffer or Uint8Array from server asset storage');
}

async function loadAsset(path: string): Promise<ArrayBuffer> {
	// Nitro's server-asset storage. `serverAssets` in nuxt.config.ts bundles
	// public/ into the function so this resolves at runtime in Azure Functions
	// where process.cwd() does not point to the source tree.
	const raw = await useStorage('assets:public').getItemRaw(path);
	if(raw == null) throw new Error(`server asset not found: ${path}`);
	return toArrayBuffer(raw);
}

async function init(): Promise<HbState> {
	// Explicit .js extensions: harfbuzzjs ships no `exports` map, and Node
	// ESM does not auto-append extensions for package subpath imports in the
	// production function (where the package is hoisted into node_modules
	// rather than being inlined by the bundler).
	const hbMod = await import('harfbuzzjs/hb.js');
	const hbjsMod = await import('harfbuzzjs/hbjs.js');
	const factory = (hbMod.default ?? hbMod) as typeof import('harfbuzzjs/hb').default;
	const wrap = (hbjsMod.default ?? hbjsMod) as typeof import('harfbuzzjs/hbjs').default;

	// Provide hb.wasm as a buffer. Skipping locateFile / readFileSync avoids
	// the bundler-stripped hb.wasm next to hb.js in the function output.
	const wasmBinary = await loadAsset('hb.wasm');
	const runtime = await factory({ wasmBinary });
	const harfbuzz = wrap(runtime);

	const fonts = new Map<string, { font: Font; upem: number; }>();
	for(const meta of FONTS) {
		const ab = await loadAsset(`fonts/${meta.file}`);
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
	// Disable OpenType ligature features so words like الله and لا render as
	// individual letters that the user can click on. Cursive joining (init /
	// medi / fina / isol) still applies because those are mandatory script
	// features, not ligatures.
	harfbuzz.shape(font, buf, '-liga,-rlig,-dlig');
	const out = buf.json();

	const glyphs: ShapedGlyph[] = [];
	let xCursor = 0;
	let hasMissingGlyphs = false;
	for(const g of out) {
		const missing = g.g === 0;
		if(missing) hasMissingGlyphs = true;
		let path: string | null = null;
		try { path = font.glyphToPath(g.g); } catch { path = null; }
		let glyphName: string | null = null;
		try { glyphName = font.glyphName(g.g); } catch { glyphName = null; }
		glyphs.push({
			glyphId: g.g,
			glyphName,
			cluster: g.cl,
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
