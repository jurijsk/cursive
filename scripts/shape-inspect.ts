/**
 * shape-inspect — CLI for raw HarfBuzz shaping diagnostics.
 *
 * Usage:
 *   npx tsx scripts/shape-inspect.ts [options] <text>
 *
 * Options:
 *   --font  <key|all>   Font key to use: tajawal|amiri|noto-naskh|reem-kufi|all  (default: all)
 *   --html              Emit a self-contained HTML document with SVG preview + glyph tables
 *   --svg               Emit a standalone SVG with the shaped glyphs to stdout
 *   --json              Output raw JSON (one object per font) instead of human-readable table
 *   --features <str>    HarfBuzz feature string   (default: '-liga,-rlig,-dlig')
 *   --em     <px>       Em size used for SVG/HTML output  (default: 96)
 *   --out   <file>      Write output to file; .html extension implies --html, .svg implies --svg
 *
 * Examples:
 *   npx tsx scripts/shape-inspect.ts جَمِيلَةٌ
 *   npx tsx scripts/shape-inspect.ts --html --out report.html جَمِيلَةٌ
 *   npx tsx scripts/shape-inspect.ts --font reem-kufi --svg جَمِيلَةٌ > out.svg
 *   npx tsx scripts/shape-inspect.ts --font tajawal --json مرحبا
 */

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── Font registry ─────────────────────────────────────────────────────────────

const FONTS = {
	tajawal: 'Tajawal-Regular.ttf',
	amiri: 'Amiri-Regular.ttf',
	'noto-naskh': 'NotoNaskhArabic-Regular.ttf',
	'reem-kufi': 'ReemKufi-Regular.ttf'
} as const;

type FontKey = keyof typeof FONTS;
const FONT_KEYS = Object.keys(FONTS) as FontKey[];

// ── Glyph types ───────────────────────────────────────────────────────────────

interface GlyphRecord {
	index: number;
	glyphId: number;
	glyphName: string | null;
	cluster: number;
	/** codepoints in the cluster's input span */
	clusterChars: string[];
	xAdvance: number;
	yAdvance: number;
	xOffset: number;
	yOffset: number;
	/** cursor x position (px at the given em size) */
	xPx: number;
	yPx: number;
	path: string | null;
	missing: boolean;
}

interface ShapeResult {
	fontKey: FontKey;
	fontFile: string;
	text: string;
	upem: number;
	scale: number;
	glyphs: GlyphRecord[];
}

// ── Arg parsing ───────────────────────────────────────────────────────────────

function parseArgs(argv: string[]): {
	fontArg: string;
	htmlMode: boolean;
	svgMode: boolean;
	jsonMode: boolean;
	features: string;
	emPx: number;
	outFile: string | null;
	text: string;
} {
	const args = argv.slice(2);
	const get = (flag: string): string | null => {
		const i = args.indexOf(flag);
		return i >= 0 ? (args[i + 1] ?? null) : null;
	};
	const has = (flag: string): boolean => args.includes(flag);

	const fontArg = get('--font') ?? 'all';
	const outFile = get('--out') ?? null;
	const svgMode = has('--svg') || (outFile?.endsWith('.svg') ?? false);
	const htmlMode = has('--html') || (outFile?.endsWith('.html') ?? false);
	const jsonMode = has('--json');
	const features = get('--features') ?? '-liga,-rlig,-dlig';
	const emPx = parseInt(get('--em') ?? '96', 10);

	// Text is the last positional argument (not a flag or flag value)
	const flagsWithValues = new Set(['--font', '--features', '--em', '--out']);
	let skipNext = false;
	const positional: string[] = [];
	for(const arg of args) {
		if(skipNext) { skipNext = false; continue; }
		if(flagsWithValues.has(arg)) { skipNext = true; continue; }
		if(arg.startsWith('--')) continue;
		positional.push(arg);
	}

	const text = positional.join(' ');
	if(!text) {
		console.error('Usage: npx tsx scripts/shape-inspect.ts [--font <key|all>] [--html] [--svg] [--json] [--out file] <text>');
		console.error('Font keys:', FONT_KEYS.join(', '));
		process.exit(1);
	}

	return { fontArg, htmlMode, svgMode, jsonMode, features, emPx, outFile, text };
}

// ── HarfBuzz init ─────────────────────────────────────────────────────────────

async function initHarfBuzz() {
	const hbMod = await import('harfbuzzjs/hb.js');
	const hbjsMod = await import('harfbuzzjs/hbjs.js');
	const factory = (hbMod.default ?? hbMod) as typeof import('harfbuzzjs/hb').default;
	const wrap = (hbjsMod.default ?? hbjsMod) as typeof import('harfbuzzjs/hbjs').default;
	const wasmBinary = await readFile(join(ROOT, 'public', 'hb.wasm'));
	const ab = wasmBinary.buffer.slice(wasmBinary.byteOffset, wasmBinary.byteOffset + wasmBinary.byteLength);
	const runtime = await factory({ wasmBinary: ab });
	return wrap(runtime);
}

// ── Shaping ───────────────────────────────────────────────────────────────────

async function shapeFont(
	harfbuzz: Awaited<ReturnType<typeof initHarfBuzz>>,
	fontKey: FontKey,
	text: string,
	features: string,
	emPx: number
): Promise<ShapeResult> {
	const fontFile = FONTS[fontKey];
	const bytes = await readFile(join(ROOT, 'public', 'fonts', fontFile));
	const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
	const blob = harfbuzz.createBlob(ab);
	const face = harfbuzz.createFace(blob, 0);
	const font = harfbuzz.createFont(face);
	const upem: number = (face as unknown as { upem?: number; getUnitsPerEM?: () => number }).upem
		?? (face as unknown as { getUnitsPerEM?: () => number }).getUnitsPerEM?.()
		?? 1000;
	const scale = emPx / upem;

	const normalized = text.normalize('NFC');
	const buf = harfbuzz.createBuffer();
	buf.addText(normalized);
	buf.guessSegmentProperties();
	harfbuzz.shape(font, buf, features);
	const raw = buf.json();

	// Build sorted cluster list to determine per-cluster char spans
	const clusters = [...new Set(raw.map((g: { cl: number }) => g.cl))].sort((a, b) => a - b);
	const charArray = Array.from(normalized);

	const glyphs: GlyphRecord[] = [];
	let xCursor = 0;

	raw.forEach((g: { g: number; cl: number; ax: number; ay: number; dx: number; dy: number }, idx: number) => {
		let glyphName: string | null = null;
		try { glyphName = font.glyphName(g.g); } catch { /* no name */ }

		let path: string | null = null;
		try { path = font.glyphToPath(g.g) || null; } catch { /* no path */ }

		const ci = clusters.indexOf(g.cl);
		const clStart = g.cl;
		const clEnd = ci >= 0 && ci < clusters.length - 1 ? clusters[ci + 1]! : charArray.length;
		const clusterChars = charArray.slice(clStart, clEnd);

		glyphs.push({
			index: idx,
			glyphId: g.g,
			glyphName,
			cluster: g.cl,
			clusterChars,
			xAdvance: g.ax,
			yAdvance: g.ay,
			xOffset: g.dx,
			yOffset: g.dy,
			xPx: (xCursor + g.dx) * scale,
			yPx: g.dy * scale,
			path,
			missing: g.g === 0
		});
		xCursor += g.ax;
	});

	buf.destroy();
	return { fontKey, fontFile, text, upem, scale, glyphs };
}

// ── Table output ──────────────────────────────────────────────────────────────

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';

function pad(s: string | number, n: number, right = false): string {
	const str = String(s);
	return right ? str.padStart(n) : str.padEnd(n);
}

function printTable(result: ShapeResult): void {
	const { fontKey, fontFile, upem, scale, glyphs } = result;
	console.log(`\n${BOLD}${CYAN}═══ ${fontKey} (${fontFile}) — upem=${upem} scale=${scale.toFixed(4)} ═══${RESET}`);
	console.log(
		`${BOLD}${pad('#', 3)} ${pad('glyph', 5)} ${pad('cluster', 7)} ${pad('chars', 10)} ${pad('name', 30)} ${pad('ax', 6)} ${pad('dx', 5)} ${pad('dy', 5)} ${pad('x(px)', 7)}${RESET}`
	);
	console.log('─'.repeat(86));
	for(const g of glyphs) {
		const chars = g.clusterChars.map(c => `U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`).join(' ');
		const label = g.clusterChars.join('');
		const missing = g.missing ? ` ${RED}MISSING${RESET}` : '';
		const mark = g.xAdvance === 0 ? `${DIM}(mark)${RESET}` : '';
		const nameCol = g.glyphName ?? `${YELLOW}(no name)${RESET}`;
		console.log(
			`${pad(g.index, 3)} ${pad(g.glyphId, 5)} ${pad(g.cluster, 7)} ${pad(label + ' ' + chars, 24)} ${pad(nameCol, 30)} ${pad(g.xAdvance, 6)} ${pad(g.xOffset, 5)} ${pad(g.yOffset, 5)} ${pad(g.xPx.toFixed(1), 7)}${missing} ${mark}`
		);
	}
}

// ── SVG output ────────────────────────────────────────────────────────────────

function buildSvg(results: ShapeResult[], emPx: number): string {
	const PADDING = 20;
	const rowHeight = emPx * 1.8 + PADDING * 2;
	const totalWidth = results.reduce((max, r) => {
		const w = r.glyphs.reduce((s, g) => s + g.xAdvance * r.scale, 0);
		return Math.max(max, w + PADDING * 2 + emPx);
	}, 400);
	const totalHeight = rowHeight * results.length + PADDING;

	const rows = results.map((result, ri) => {
		const baseline = PADDING + emPx * 1.2 + ri * rowHeight;
		const runWidth = result.glyphs.reduce((s, g) => s + g.xAdvance * result.scale, 0);
		const offsetX = PADDING + Math.max(0, totalWidth - PADDING * 2 - runWidth - emPx);

		const paths = result.glyphs
			.filter(g => g.path)
			.map(g => {
				const tx = (offsetX + g.xPx).toFixed(2);
				const ty = (baseline - g.yPx).toFixed(2);
				const sc = result.scale.toFixed(6);
				const fill = g.missing ? 'red' : '#222';
				const title = `<title>${g.glyphName ?? g.glyphId} cl=${g.cluster} [${g.clusterChars.join('')}]</title>`;
				return `<g transform="translate(${tx},${ty}) scale(${sc},-${sc})">${title}<path d="${g.path}" fill="${fill}"/></g>`;
			})
			.join('\n    ');

		const label = `<text x="${PADDING}" y="${baseline - emPx * 1.3}" font-family="monospace" font-size="12" fill="#888">${result.fontKey}</text>`;
		const baseline_line = `<line x1="${PADDING}" y1="${baseline}" x2="${totalWidth - PADDING}" y2="${baseline}" stroke="#e0e0e0" stroke-width="1"/>`;

		return `  <g data-font="${result.fontKey}">\n    ${label}\n    ${baseline_line}\n    ${paths}\n  </g>`;
	});

	return [
		`<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" style="background:#fff">`,
		...rows,
		'</svg>'
	].join('\n');
}

// ── HTML output ───────────────────────────────────────────────────────────────

function esc(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildHtmlTable(result: ShapeResult): string {
	const rows = result.glyphs.map(g => {
		const chars = g.clusterChars
			.map(c => `<span class="ucode" title="${esc(c)}">U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}</span>`)
			.join(' ');
		const label = esc(g.clusterChars.join(''));
		const rowClass = g.missing ? ' class="missing"' : g.xAdvance === 0 ? ' class="mark"' : '';
		const nameTd = g.glyphName
			? `<td class="mono">${esc(g.glyphName)}</td>`
			: '<td class="mono dim">(no name)</td>';
		return `<tr${rowClass}>
      <td class="num">${g.index}</td>
      <td class="num">${g.glyphId}</td>
      <td class="num">${g.cluster}</td>
      <td class="chars"><span class="ar">${label}</span> ${chars}</td>
      ${nameTd}
      <td class="num">${g.xAdvance}</td>
      <td class="num">${g.xOffset}</td>
      <td class="num">${g.yOffset}</td>
      <td class="num">${g.xPx.toFixed(1)}</td>
      <td class="tag">${g.xAdvance === 0 ? '<span class="badge mark-badge">mark</span>' : ''}${g.missing ? '<span class="badge miss-badge">MISSING</span>' : ''}</td>
    </tr>`;
	}).join('\n');

	return `<section class="font-section" id="${esc(result.fontKey)}">
  <h2>${esc(result.fontKey)} <span class="subtitle">${esc(result.fontFile)} · upem=${result.upem} · scale=${result.scale.toFixed(4)}</span></h2>
  <table>
    <thead>
      <tr>
        <th>#</th><th>glyph</th><th>cluster</th><th>chars</th>
        <th>name</th><th>ax</th><th>dx</th><th>dy</th><th>x(px)</th><th></th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</section>`;
}

function buildHtml(results: ShapeResult[], text: string, features: string, emPx: number): string {
	const svg = buildSvg(results, emPx);
	const tables = results.map(r => buildHtmlTable(r)).join('\n');
	const navLinks = results.map(r =>
		`<a href="#${esc(r.fontKey)}">${esc(r.fontKey)}</a>`
	).join(' · ');
	const generated = new Date().toISOString();

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>shape-inspect: ${esc(text)}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0d1117; --surface: #161b22; --border: #30363d;
    --text: #e6edf3; --dim: #8b949e; --accent: #58a6ff;
    --mark-bg: #1c2537; --miss-bg: #3d1a1a;
    --mark-fg: #79c0ff; --miss-fg: #f85149;
    --font-mono: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  }
  body { background: var(--bg); color: var(--text); font-family: var(--font-mono); font-size: 13px; line-height: 1.5; padding: 2rem; }
  h1 { font-size: 1.4rem; color: var(--accent); margin-bottom: .25rem; }
  .meta { color: var(--dim); font-size: .85rem; margin-bottom: 2rem; }
  nav { margin-bottom: 2rem; }
  nav a { color: var(--accent); text-decoration: none; margin-right: .5rem; }
  nav a:hover { text-decoration: underline; }

  .svg-preview { background: #fff; border: 1px solid var(--border); border-radius: 6px; overflow: auto; margin-bottom: 3rem; padding: .5rem; max-width: 100%; }
  .svg-preview svg { display: block; max-width: 100%; height: auto; }

  .font-section { margin-bottom: 3rem; scroll-margin-top: 1rem; }
  h2 { font-size: 1rem; color: var(--accent); border-bottom: 1px solid var(--border); padding-bottom: .4rem; margin-bottom: 1rem; }
  .subtitle { color: var(--dim); font-weight: normal; font-size: .85rem; }

  table { border-collapse: collapse; width: 100%; }
  th { text-align: left; color: var(--dim); padding: .3rem .6rem; border-bottom: 1px solid var(--border); white-space: nowrap; }
  td { padding: .25rem .6rem; border-bottom: 1px solid #21262d; white-space: nowrap; vertical-align: middle; }
  tr:hover td { background: #1c2128; }
  tr.mark td { background: var(--mark-bg); }
  tr.missing td { background: var(--miss-bg); }

  .num { text-align: right; color: var(--dim); }
  .mono { font-family: var(--font-mono); }
  .dim { color: var(--dim); font-style: italic; }
  .chars { min-width: 12rem; }
  .ar { font-family: 'Noto Naskh Arabic', 'Amiri', serif; font-size: 1.2em; margin-right: .4rem; direction: rtl; display: inline-block; }
  .ucode { color: var(--dim); font-size: .85em; }
  .tag { width: 5rem; }
  .badge { display: inline-block; border-radius: 4px; padding: .05rem .4rem; font-size: .75em; }
  .mark-badge { background: #1a3050; color: var(--mark-fg); }
  .miss-badge { background: #5a1a1a; color: var(--miss-fg); }
</style>
</head>
<body>
<h1>shape-inspect: <span dir="rtl">${esc(text)}</span></h1>
<p class="meta">features: <code>${esc(features)}</code> · em: ${emPx}px · generated: ${generated}</p>
<nav>${navLinks}</nav>

<div class="svg-preview">
${svg}
</div>

${tables}
</body>
</html>`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const { fontArg, htmlMode, svgMode, jsonMode, features, emPx, outFile, text } = parseArgs(process.argv);

const targetFonts: FontKey[] = fontArg === 'all'
	? FONT_KEYS
	: fontArg.split(',').map(k => k.trim() as FontKey).filter(k => {
		if(!FONTS[k]) {
			console.error(`Unknown font key: "${k}". Valid keys: ${FONT_KEYS.join(', ')}`);
			process.exit(1);
		}
		return true;
	});

const harfbuzz = await initHarfBuzz();
const results: ShapeResult[] = [];

for(const fontKey of targetFonts) {
	results.push(await shapeFont(harfbuzz, fontKey, text, features, emPx));
}

async function writeOut(content: string, label: string): Promise<void> {
	if(outFile) {
		const outPath = outFile.match(/^([A-Za-z]:[\\/]|\/)/) ? outFile : join(process.cwd(), outFile);
		await writeFile(outPath, content, 'utf8');
		console.error(`${label} written to ${outPath}`);
	} else {
		process.stdout.write(content + '\n');
	}
}

if(jsonMode) {
	await writeOut(JSON.stringify(results, null, 2), 'JSON');
} else if(htmlMode) {
	await writeOut(buildHtml(results, text, features, emPx), 'HTML');
} else if(svgMode) {
	await writeOut(buildSvg(results, emPx), 'SVG');
} else {
	for(const result of results) {
		printTable(result);
	}
	console.log();
}
