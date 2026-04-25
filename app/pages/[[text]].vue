<script setup lang="ts">
interface ShapedGlyph {
	glyphId: number;
	path: string | null;
	x: number;
	y: number;
	xAdvance: number;
	missing: boolean;
}

interface ShapeResult {
	font: string;
	upem: number;
	hasMissingGlyphs: boolean;
	glyphs: ShapedGlyph[];
}

interface FontOption {
	key: string;
	label: string;
	family: string;
}

useHead({
	title: 'Cursive'
});

const route = useRoute();
const param = (route.params.text as string | undefined) ?? '';
const input = ref(param || 'مرحبا');

// Mirror of the server's font registry; key must match server keys exactly.
const fontOptions: FontOption[] = [
	{ key: 'tajawal', label: 'Tajawal', family: 'Tajawal' },
	{ key: 'amiri', label: 'Amiri', family: 'Amiri' },
	{ key: 'noto-naskh', label: 'Noto Naskh', family: 'Noto Naskh Arabic' },
	{ key: 'reem-kufi', label: 'Reem Kufi', family: 'Reem Kufi' }
];
const selectedFont = ref<string>('tajawal');

const examples: { label: string; text: string; }[] = [
	{ label: 'marhaba', text: 'مرحبا' },
	{ label: 'habibi', text: 'حبيبي' },
	{ label: 'shukran', text: 'شكرا' },
	{ label: 'as-salamu alaykum', text: 'السلام عليكم' },
	{ label: 'inshallah', text: 'إن شاء الله' },
	{ label: 'salam ligature', text: 'ﷵ' },
	{ label: 'sallallahu ligature', text: 'ﷺ' }
];

const DESIRED_EM = 120; // px em size for rendering

const { data, refresh, error, status } = await useAsyncData<ShapeResult>('shape-text', () =>
	$fetch<ShapeResult>('/api/shape', { method: 'POST', body: { text: input.value, font: selectedFont.value } })
);

// Sync the picker to whatever font the server actually used
// (covers the case where the requested key was unknown and the server fell back).
watch(() => data.value?.font, (f) => {
	if(f && f !== selectedFont.value) selectedFont.value = f;
});

const fontFamily = computed(() => fontOptions.find(f => f.key === selectedFont.value)?.family ?? 'Tajawal');
const glyphs = computed<ShapedGlyph[]>(() => data.value?.glyphs ?? []);
const upem = computed(() => data.value?.upem ?? 1000);
const scale = computed(() => DESIRED_EM / upem.value);
const totalWidth = computed(() =>
	Math.max(400, glyphs.value.reduce((s, g) => s + (g.xAdvance || 0), 0) * scale.value + 20)
);
const hasMissingGlyphs = computed(() => data.value?.hasMissingGlyphs ?? false);

// NFKC decomposes presentation-form ligatures (ﷵ, ﷺ, etc.) into their
// constituent letters; if the input differs from its NFKC form, it contains a ligature.
const normalized = computed(() => input.value.normalize('NFKC'));
const hasLigature = computed(() => normalized.value !== input.value);

function applyNormalized() {
	input.value = normalized.value;
}

let timer: ReturnType<typeof setTimeout> | null = null;
watch([input, selectedFont], () => {
	if(timer) clearTimeout(timer);
	timer = setTimeout(() => { refresh(); }, 200);
});
</script>
<template>
	<div>
		<label>Text:</label>
		<input v-model="input" >
		<div v-if="hasLigature" class="ligature-notice">
			<span>Contains a ligature character. Decomposed:</span>
			<strong class="ligature-preview">{{ normalized }}</strong>
			<button type="button" class="replace-btn" @click="applyNormalized">Replace</button>
		</div>
		<div class="font-picker">
			<span class="picker-label">Font</span>
			<button
				v-for="f in fontOptions"
				:key="f.key"
				type="button"
				:class="{ 'font-btn': true, active: selectedFont === f.key }"
				@click="selectedFont = f.key"
			>
				<span class="font-btn-label">{{ f.label }}</span>
				<span class="font-btn-sample" :style="{ fontFamily: f.family }">مرحبا</span>
			</button>
		</div>
		<div v-if="hasMissingGlyphs" class="missing-notice">
			This font doesn't have glyphs for some characters in the text. Try a different font.
		</div>
		<div class="examples">
			<button v-for="ex in examples" :key="ex.text" type="button" @click="input = ex.text">
				<span class="ex-text" :style="{ fontFamily: fontFamily }">{{ ex.text }}</span>
				<span class="ex-label">{{ ex.label }}</span>
			</button>
		</div>
		<h1 :style="{ fontFamily: fontFamily }">{{ input }}</h1>
		<div v-if="error">Error: {{ error.message }}</div>
		<svg :width="totalWidth" :height="DESIRED_EM + 40" viewBox="0 0 800 200" style="border:1px solid #ddd">
			<g :transform="`translate(10, ${DESIRED_EM + 10}) scale(1, -1)`">
				<template v-for="(g, i) in glyphs" :key="i">
					<path v-if="g.path && !g.missing" :d="g.path" :transform="`translate(${g.x * scale},${g.y * scale}) scale(${scale})`" fill="black" />
					<path v-else-if="g.path && g.missing" :d="g.path" :transform="`translate(${g.x * scale},${g.y * scale}) scale(${scale})`" fill="#cc0000" />
					<rect v-else :x="g.x * scale" y="-2" :width="8" height="4" fill="red" />
				</template>
			</g>
		</svg>
		<div v-if="status === 'pending'">Shaping...</div>
	</div>
</template>
<style scoped>
	h1 {
		font-weight: 400;
		font-size: 5rem;
	}

	input {
		padding: 0.4rem;
		margin-bottom: 0.6rem
	}

	.font-picker {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.picker-label {
		font-size: 0.85rem;
		color: #555;
		margin-right: 0.2rem;
	}

	.font-btn {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		padding: 0.4rem 0.8rem;
		border: 1px solid #c8c8c8;
		border-radius: 0.5rem;
		background: #fff;
		color: #1a1a1a;
		cursor: pointer;
		line-height: 1.2;
		transition: background-color 0.15s, border-color 0.15s;
	}

	.font-btn:hover {
		background: #f1f1f1;
		border-color: #888;
	}

	.font-btn.active {
		border-color: #1a1a1a;
		background: #1a1a1a;
		color: #fff;
	}

	.font-btn-label {
		font-size: 0.75rem;
		letter-spacing: 0.02em;
	}

	.font-btn-sample {
		font-size: 1.3rem;
		direction: rtl;
	}

	.examples {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 1.2rem;
	}

	.examples button {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: 0.1rem;
		padding: 0.5rem 0.9rem;
		border: 1px solid #c8c8c8;
		border-radius: 0.6rem;
		background: #fff;
		color: #1a1a1a;
		cursor: pointer;
		line-height: 1.2;
		transition: background-color 0.15s, border-color 0.15s;
	}

	.examples button:hover {
		background: #f1f1f1;
		border-color: #888;
	}

	.ex-text {
		font-size: 1.5rem;
		color: #111;
		direction: rtl;
	}

	.ex-label {
		font-size: 0.75rem;
		color: #666;
		letter-spacing: 0.02em;
	}

	.ligature-notice {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.6rem 0.9rem;
		margin-bottom: 0.8rem;
		background: #fff8e1;
		border: 1px solid #e8c14a;
		border-radius: 0.4rem;
		font-size: 0.95rem;
		color: #1a1a1a;
	}

	.ligature-preview {
		font-family: 'Tajawal';
		font-size: 1.3rem;
		color: #111;
	}

	.replace-btn {
		margin-left: auto;
		padding: 0.35rem 0.8rem;
		border: 1px solid #1a1a1a;
		background: #fff;
		color: #1a1a1a;
		border-radius: 0.3rem;
		font-size: 0.9rem;
		cursor: pointer;
	}

	.replace-btn:hover {
		background: #1a1a1a;
		color: #fff;
	}

	.missing-notice {
		padding: 0.5rem 0.9rem;
		margin-bottom: 0.8rem;
		background: #fdecea;
		border: 1px solid #d97a76;
		border-radius: 0.4rem;
		font-size: 0.9rem;
		color: #8a1a13;
	}

	svg {
		display: block;
		max-width: 100%;

		path {
			pointer-events: painted;

			&:hover {
				fill: aqua;
			}
		}
	}
</style>
