<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const param = (route.params.text as string) ?? '';
const input = ref(param || 'مرحبا');
const fontLoaded = ref(false);
const glyphs = ref<Array<{ d: string; x: number; width: number; }>>([]);
const rawPath = ref('');
const rawWidth = ref(0);
const fontSize = ref(120);

async function renderWithOpenType(text: string) {
	glyphs.value = [];
	try {
		const opentype = await import('opentype.js');
		const font = await new Promise<any>((resolve, reject) => {
			opentype.load('/fonts/Tajawal-Regular.ttf', (err: any, f: any) => (err ? reject(err) : resolve(f)));
		});

		const normalized = (text ?? '').normalize('NFC');
		// Heuristic ligature handling without HarfBuzz:
		// 1) Split into user-perceived grapheme clusters (base + combining marks).
		// 3) For each accepted cluster/ligature call `font.getPath()` and `font.getAdvanceWidth()`
		// This produces per-cluster outlines while allowing common OT ligatures (e.g., lam+alef).

		// split into grapheme-like clusters: base char + following combining marks
		const graphemes: string[] = [];
		const combining = /\p{M}/u;
		const chars = Array.from(normalized);
		for(let i = 0;i < chars.length;i++) {
			let cur = chars[i]!;
			// include following combining marks
			let j = i + 1;
			while(j < chars.length && combining.test(chars[j]!)) {
				cur += chars[j]!;
				j++;
			}
			graphemes.push(cur);
			i = j - 1;
		}

		let x = 0;
		const out: Array<{ d: string; x: number; width: number; }> = [];
		// Compute advance widths for each grapheme, then layout RTL: first grapheme on the right.
		const advances: number[] = [];
		for(let i = 0;i < graphemes.length;i++) {
			const g = graphemes[i];
			const adv = (font.getAdvanceWidth ? font.getAdvanceWidth(g, fontSize.value) : (() => {
				const ga = font.stringToGlyphs(g);
				return ga.reduce((s: number, gg: any) => s + (gg.advanceWidth || 0), 0) * (fontSize.value / (font.unitsPerEm || 1000));
			})());
			advances.push(adv);
		}

		const total = advances.reduce((s, a) => s + a, 0) || 300;
		let sumW = 0;
		for(let i = 0;i < graphemes.length;i++) {
			const g = graphemes[i];
			const w = advances[i] || 0;
			// position from right: total - cum - w
			const xpos = total - sumW - w;
			const path = font.getPath(g, xpos, fontSize.value, fontSize.value, { features: ['liga', 'calt', 'rlig'] });
			const d = (path as any).toPathData ? (path as any).toPathData(2) : (path as any).toSVG ? (path as any).toSVG() : '';
			out.push({ d, x: xpos, width: w });
			sumW += w;
		}

		glyphs.value = out;
		; (glyphs as any)._totalWidth = x || 300;

		// Also create a raw single path for the entire string (no greedy ligature logic)
		try {
			const rawP = font.getPath(normalized, 0, fontSize.value, fontSize.value);
			rawPath.value = (rawP as any).toPathData ? (rawP as any).toPathData(2) : (rawP as any).toSVG ? (rawP as any).toSVG() : '';
			rawWidth.value = (font.getAdvanceWidth ? font.getAdvanceWidth(normalized, fontSize.value) : x) || 300;
		} catch(e) {
			rawPath.value = '';
			rawWidth.value = x || 300;
		}

		fontLoaded.value = true;
	} catch(e) {
		console.error('opentype render error', e);
		fontLoaded.value = false;
	}
}

onMounted(() => {
	renderWithOpenType(input.value);
});

watch(input, (v) => renderWithOpenType(v));
</script>
<template>
	<div class="opentype-test">
		<label>{{ param }}</label>
		<input v-model="input" />
		<div v-if="!fontLoaded">Loading font and rendering (client only)...</div>
		<div v-else class="svg-comparison">
			<svg :width="Math.max(300, glyphs.reduce((s, g) => s + g.width, 0))" :height="fontSize + 20" xmlns="http://www.w3.org/2000/svg">
				<g fill="black" stroke="none">
					<template v-for="(g, idx) in glyphs" :key="idx">
						<path :d="g.d" />
					</template>
				</g>
			</svg>
			<!-- Raw single-path rendering (no greedy processing) - always shown side-by-side -->
			<svg :width="Math.max(300, rawWidth)" :height="fontSize + 20" xmlns="http://www.w3.org/2000/svg">
				<g fill="none" stroke="black">
					<path :d="rawPath" />
				</g>
			</svg>
		</div>
	</div>
</template>
<style scoped>
.opentype-test {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.svg-comparison {
	display: flex;
	gap: 1rem;
	align-items: flex-start;
}

input {
	padding: 0.4rem;
	font-size: 1rem;
}
</style>
