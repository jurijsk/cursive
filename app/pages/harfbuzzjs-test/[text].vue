<script setup lang="ts">
import type { HarfBuzzModule } from 'harfbuzzjs/hb';
import type { HarfBuzzAPI, Font, Face } from 'harfbuzzjs/hbjs';

	interface ShapedGlyph {
		glyphId: number;
		path: string | null;
		x: number;
		y: number;
		xAdvance: number;
		scale: number;
	}

const route = useRoute();
const param = (route.params.text as string) ?? '';
const input = ref(param || 'مرحبا');

const glyphs = ref<ShapedGlyph[]>([]);
const error = ref<string | null>(null);
const ready = ref(false);

let hbRuntime: HarfBuzzModule | null = null;
let harfbuzz: HarfBuzzAPI | null = null;
let fontObj: Font | null = null;
let faceObj: Face | null = null;

const DESIRED_EM = 120; // px em size for rendering

const faceUpem = computed(() => faceObj?.upem || 1000);

async function initHarfbuzz() {
	try {
		// load hb runtime factory and wrapper
		const harfbuzzjs = await import('harfbuzzjs/hb');
		const hbWrapperMod = await import('harfbuzzjs/hbjs');
		const hbFactory = harfbuzzjs.default ?? harfbuzzjs;
		const hbModule = await hbFactory({ locateFile: () => '/hb.wasm' });
		hbRuntime = hbModule;
		const hbWrapper = hbWrapperMod.default ?? hbWrapperMod;
		const hbInstance = hbWrapper(hbRuntime);
		harfbuzz = hbInstance;

		// load font once
		const fontBuf = await fetch('/fonts/Tajawal-Regular.ttf').then(r => r.arrayBuffer());
		const blob = hbInstance.createBlob(fontBuf);
		faceObj = hbInstance.createFace(blob, 0);
		fontObj = hbInstance.createFont(faceObj);

		ready.value = true;
	} catch(e: unknown) {
		console.error('init harfbuzz error', e);
		error.value = String(e instanceof Error ? e.message : e);
	}
}

async function shapeAndRender(text: string) {
	if(!ready.value || !harfbuzz || !fontObj || !faceObj) return;
	try {

		glyphs.value.length = 0;
		const buf = harfbuzz.createBuffer();
		buf.addText((text ?? '').normalize('NFC'));
		buf.guessSegmentProperties();
		harfbuzz.shape(fontObj, buf);
		const out = buf.json(); // array of { g, cl, ax, ay, dx, dy }

		// face.upem gives units-per-em
		const upem = faceObj.upem || 1000;
		const scale = DESIRED_EM / upem;

		let xCursor = 0;
		const items: ShapedGlyph[] = [];
		for(const g of out) {
			const glyphId = g.g;
			const xAdvance = g.ax;
			const xDisp = g.dx;
			const yDisp = g.dy;

			let path: string | null = null;
			try { path = fontObj.glyphToPath(glyphId); } catch { path = null; }

			// position in px after scaling; note: we flip the svg Y axis in the group,
			// so invert the y displacement here (HarfBuzz dy is in font units)
			const x = (xCursor + xDisp) * scale;
			const y = yDisp * scale;

			items.push({ glyphId, path, x, y, xAdvance: xAdvance * scale, scale });

			xCursor += xAdvance;
		}

		glyphs.value = items;
		buf.destroy();
	} catch(e: unknown) {
		console.error('shape error', e);
		error.value = String(e instanceof Error ? e.message : e);
	}
}

onMounted(async () => {
	await initHarfbuzz();
	await shapeAndRender(input.value);
});

watch(input, (v) => shapeAndRender(v));
</script>
<template>
	<div>
		<label>Text:</label>
		<input v-model="input" >
		<h1>{{ input }}</h1>
		<div v-if="error">Error: {{ error }}</div>
		<div v-if="ready">
			<svg :width="Math.max(400, (glyphs.reduce((s, g) => s + (g.xAdvance || 0), 0) + 20))" :height="DESIRED_EM + 40" viewBox="0 0 800 200" style="border:1px solid #ddd">
				<g :transform="`translate(10, ${DESIRED_EM + 10}) scale(1, -1)`">
					<template v-for="(g, i) in glyphs" :key="i">
						<path v-if="g.path" :d="g.path" :transform="`translate(${g.x},${g.y}) scale(${DESIRED_EM / faceUpem})`" fill="black" />
						<rect v-else :x="g.x" y="-2" :width="8" height="4" fill="red" />
					</template>
				</g>
			</svg>
		</div>
		<div v-else>Initializing HarfBuzz...</div>
	</div>
</template>
<style scoped>
	h1 {
		font-family: 'Tajawal Regular';
		font-weight: 400;
		font-size: 5rem;
	}

	input {
		padding: 0.4rem;
		margin-bottom: 0.6rem
	}

	svg {
		display: block;
		max-width: 100%;

		path {
			pointer-events: painted;
			stroke: orange;
			stroke-width: 100px;

			stroke-opacity: .3;



			&:hover {
				fill: aqua;
			}
		}
	}
</style>