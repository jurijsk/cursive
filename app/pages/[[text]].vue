<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { letters, type Dialect } from '~/data/letters';
import { findVocalizableMatches, applySpellings } from '~/data/spellings';
import { useSettingsStore, type FontKey } from '~/stores/settings';
import { groupGlyphsIntoUnits, resolveGlyphSelection, letterPreviewInContext, findPrevBaseChar, findNextBaseChar, type ShapedGlyph as ShapedGlyphT } from '~/utils/glyphs';

interface ShapedGlyph {
	glyphId: number;
	glyphName: string | null;
	cluster: number;
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
	key: FontKey;
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

// Font and dialect are persisted to localStorage by the Pinia store so they
// survive reloads and (later) sync with a user account.
const settings = useSettingsStore();
const { font: selectedFont, dialect } = storeToRefs(settings);

const examples: { label: string; text: string; }[] = [
	{ label: 'marhaba', text: 'مرحبا' },
	{ label: 'habibi', text: 'حبيبي' },
	{ label: 'shukran', text: 'شكرا' },
	{ label: 'as-salamu alaykum', text: 'السلام عليكم' },
	{ label: 'inshallah', text: 'إن شاء اللّٰه' },
	{ label: 'allah', text: 'اللّٰه' },
	// Vocalized examples — show how a word looks with full diacritics so
	// learners can see fatha, kasra, damma, sukun, shadda, tanwins, madda etc.
	{ label: 'kataba (he wrote)', text: 'كَتَبَ' },
	{ label: 'muslim', text: 'مُسْلِمٌ' },
	{ label: 'bismillah', text: 'بِسْمِ اللّٰهِ' },
	{ label: 'qur\'aan', text: 'قُرْآنٌ' },
	{ label: 'jameelah (beautiful)', text: 'جَمِيلَةٌ' },
	{ label: 'shadda + tanwin', text: 'مُحَمَّدٌ' },
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
	if(f && f !== selectedFont.value) selectedFont.value = f as FontKey;
});

const fontFamily = computed(() => fontOptions.find(f => f.key === selectedFont.value)?.family ?? 'Tajawal');
const selectedGlyph = ref<ShapedGlyph | null>(null);

interface GlyphSelection {
	glyph: ShapedGlyph;
	sourceText: string;
	letterChar: string | null;
}

// Map a clicked glyph back to its source character(s) in the input via cluster.
// Multiple glyphs can share a cluster (base + diacritic mark) and multiple input
// chars can share a cluster (ligatures). For RTL text the buffer is in visual
// order so "next glyph in array" can have a smaller cluster id; we find the
// next larger cluster across all glyphs to determine where this cluster's span
// ends. Within a cluster, the glyph buffer order doesn't always match input
// order (marks may come before their base), so we partition by xAdvance
// (marks have advance=0) and pair with chars partitioned by Unicode mark
// category. That keeps a clicked diacritic resolving to its own char.
const selection = computed<GlyphSelection | null>(() => {
	const sg = selectedGlyph.value;
	if(!sg) return null;
	return resolveGlyphSelection(sg, glyphs.value, input.value, letters);
});

const selectedLetter = computed(() => selection.value?.letterChar ? letters[selection.value.letterChar] ?? null : null);

// glyphClusters is now in reading order (ascending cluster id, letter-then-
// diacritics within each cluster). currentUnitIndex is the position in that
// reading-order array.
const currentUnitIndex = computed(() => {
	const sg = selectedGlyph.value;
	if(!sg) return -1;
	return glyphClusters.value.findIndex(unit => unit.glyphs.some(g => g.cluster === sg.cluster && g.glyphId === sg.glyphId));
});

// Detect script direction by finding the first two cluster groups in reading
// order and comparing their letter glyph X positions. Diacritic-vs-letter X
// positions within a single cluster are too close to give a reliable signal,
// so we look for two units with *different* cluster ids.
const isRtl = computed(() => {
	const units = glyphClusters.value;
	if(units.length < 2) return false;
	const first = units[0]!;
	const second = units.find(u => u.cluster !== first.cluster);
	if(!second) return false;
	const x0 = first.glyphs[0]?.x ?? 0;
	const x1 = second.glyphs[0]?.x ?? 0;
	return x0 > x1;
});

// LEFT and RIGHT buttons map to "visually leftward" and "visually rightward"
// regardless of script. For RTL the array's idx+1 is visually leftward (forward
// in reading), so LEFT = idx+1; for LTR it's the other way around.
const leftUnit = computed(() => {
	const idx = currentUnitIndex.value;
	const units = glyphClusters.value;
	if(idx < 0) return null;
	const target = isRtl.value ? idx + 1 : idx - 1;
	return target >= 0 && target < units.length ? units[target] ?? null : null;
});
const rightUnit = computed(() => {
	const idx = currentUnitIndex.value;
	const units = glyphClusters.value;
	if(idx < 0) return null;
	const target = isRtl.value ? idx - 1 : idx + 1;
	return target >= 0 && target < units.length ? units[target] ?? null : null;
});
// Backwards-compatible aliases used by the template.
const prevUnit = leftUnit;
const nextUnit = rightUnit;
const prevPreview = computed(() => unitPreview(prevUnit.value));
const nextPreview = computed(() => unitPreview(nextUnit.value));

function unitPreview(unit: { cluster: number; glyphs: ShapedGlyph[]; } | null): string {
	if(!unit || !unit.glyphs[0]) return '';
	const sel = resolveGlyphSelection(unit.glyphs[0], glyphs.value, input.value, letters);
	const c = sel.letterChar;
	// Diacritics are combining marks — show them on a tatweel so they have a base.
	if(c && letters[c]?.kind === 'diacritic') return 'ـ' + c;
	if(!c) return sel.sourceText;
	// Letter — render in the same contextual form (initial / medial / final /
	// isolated) it takes inside the word, so the preview matches what the user
	// sees in the rendered text. ZWJ around the letter forces the form.
	const prevBase = findPrevBaseChar(input.value, unit.cluster);
	const allClusters = [...new Set(glyphs.value.map(x => x.cluster))].sort((a, b) => a - b);
	const ci = allClusters.indexOf(unit.cluster);
	const clusterEnd = ci >= 0 && ci < allClusters.length - 1 ? allClusters[ci + 1]! : input.value.length;
	const nextBase = findNextBaseChar(input.value, clusterEnd);
	return letterPreviewInContext(c, prevBase, nextBase);
}

function selectAdjacent(unit: { cluster: number; glyphs: ShapedGlyph[]; } | null) {
	if(unit && unit.glyphs[0]) selectedGlyph.value = unit.glyphs[0];
}

function selectGlyph(g: ShapedGlyph) {
	// Click the same glyph again to deselect (toggle the panel off).
	const cur = selectedGlyph.value;
	if(cur && cur.cluster === g.cluster && cur.glyphId === g.glyphId) {
		selectedGlyph.value = null;
	} else {
		selectedGlyph.value = g;
	}
}

// Clear panel when input changes — the selection is no longer meaningful.
watch(input, () => { selectedGlyph.value = null; });

const glyphs = computed<ShapedGlyph[]>(() => data.value?.glyphs ?? []);
const glyphClusters = computed(() => groupGlyphsIntoUnits(glyphs.value, input.value));
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

// Words whose conventional spelling carries diacritics that bare typing omits
// (Allah, demonstratives with dagger alef, etc.). Show a notice when the input
// contains a bare form, offering to insert the diacritics.
const vocalizableMatches = computed(() => findVocalizableMatches(input.value));
const vocalizedPreview = computed(() => applySpellings(input.value));

function applyVocalization() {
	input.value = applySpellings(input.value);
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
		<div v-if="vocalizableMatches.length" class="ligature-notice">
			<span>Add canonical diacritics ({{ vocalizableMatches.map(m => m.note.split(' — ')[0]).join(', ') }}):</span>
			<strong class="ligature-preview">{{ vocalizedPreview }}</strong>
			<button type="button" class="replace-btn" @click="applyVocalization">Add diacritics</button>
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
		<div v-if="error">Error: {{ error.message }}</div>
		<svg :width="totalWidth" :height="DESIRED_EM + 40" viewBox="0 0 800 200" style="border:1px solid #ddd">
			<g :transform="`translate(10, ${DESIRED_EM + 10}) scale(1, -1)`">
				<g v-for="(group, ui) in glyphClusters" :key="ui" :class="{ 'glyph-cluster': true, selected: ui === currentUnitIndex }" :data-cluster="group.cluster">
					<template v-for="(g, i) in group.glyphs" :key="i">
						<path
							v-if="g.path"
							:d="g.path"
							:transform="`translate(${g.x * scale},${g.y * scale}) scale(${scale})`"
							:class="{ 'glyph-path': true, missing: g.missing }"
							:data-cluster="g.cluster"
							:data-glyph-name="g.glyphName"
							@click="selectGlyph(g)"
						/>
						<rect v-else :x="g.x * scale" y="-2" :width="8" height="4" fill="red" />
					</template>
				</g>
			</g>
		</svg>
		<div v-if="status === 'pending'">Shaping...</div>

		<aside v-if="selection" class="info-panel">
			<div class="panel-body">
				<div class="panel-nav">
					<button
						type="button"
						class="nav-btn prev"
						:disabled="!prevUnit"
						@click="selectAdjacent(prevUnit)"
					>
						<span class="nav-arrow">←</span>
						<span class="nav-preview" :style="{ fontFamily: fontFamily }">{{ prevPreview }}</span>
					</button>
					<button
						type="button"
						class="nav-btn next"
						:disabled="!nextUnit"
						@click="selectAdjacent(nextUnit)"
					>
						<span class="nav-preview" :style="{ fontFamily: fontFamily }">{{ nextPreview }}</span>
						<span class="nav-arrow">→</span>
					</button>
				</div>
				<template v-if="selectedLetter">
					<div class="panel-letter-row">
						<span class="panel-letter" :style="{ fontFamily: fontFamily }">{{ selectedLetter.kind === 'diacritic' ? 'ـ' + selectedLetter.char : selectedLetter.char }}</span>
						<div class="letter-info">
							<div class="letter-name">
								{{ selectedLetter.name }} ({{ selectedLetter.arabicName }})
								<span class="letter-kind">{{ selectedLetter.kind === 'diacritic' ? 'diacritic' : 'letter' }}</span>
							</div>
							<div class="letter-translit"><strong>Transliteration:</strong> {{ selectedLetter.transliteration.join(', ') }}</div>
						</div>
					</div>
					<div v-if="selectedLetter.forms" class="forms-row">
						<div class="form-cell">
							<div class="form-label">isolated</div>
							<div class="form-glyph" :style="{ fontFamily: fontFamily }">{{ selectedLetter.forms.isolated }}</div>
						</div>
						<div class="form-cell">
							<div class="form-label">initial</div>
							<div class="form-glyph" :style="{ fontFamily: fontFamily }">{{ selectedLetter.forms.initial }}</div>
						</div>
						<div class="form-cell">
							<div class="form-label">medial</div>
							<div class="form-glyph" :style="{ fontFamily: fontFamily }">{{ selectedLetter.forms.medial }}</div>
						</div>
						<div class="form-cell">
							<div class="form-label">final</div>
							<div class="form-glyph" :style="{ fontFamily: fontFamily }">{{ selectedLetter.forms.final }}</div>
						</div>
					</div>
					<div class="pron-row">
						<div class="pron-header">
							<div class="pron-label">Pronunciation</div>
							<div class="dialect-picker">
								<button
									type="button"
									:class="{ 'dialect-btn': true, active: dialect === 'palestinian' }"
									@click="dialect = 'palestinian'"
								>Palestinian</button>
								<button
									type="button"
									:class="{ 'dialect-btn': true, active: dialect === 'lebanese' }"
									@click="dialect = 'lebanese'"
								>Lebanese</button>
							</div>
						</div>
						<div class="pron-ipa">{{ selectedLetter.pronunciation[dialect].ipa }}</div>
						<div class="pron-desc">{{ selectedLetter.pronunciation[dialect].description }}</div>
						<div v-if="selectedLetter.pronunciation[dialect].englishExamples.length" class="pron-examples">
							<strong>English examples:</strong>
							<span>{{ selectedLetter.pronunciation[dialect].englishExamples.join(', ') }}</span>
						</div>
					</div>
				</template>
				<div v-else class="no-letter">No letter information available for this glyph.</div>
			</div>
		</aside>

		<div class="font-picker">
			<span class="picker-label">Font</span>
			<button
				v-for="f in fontOptions"
				:key="f.key"
				type="button"
				:class="{ 'font-btn': true, active: selectedFont === f.key }"
				@click="selectedFont = f.key"
			>
				<span class="font-btn-sample" :style="{ fontFamily: f.family }">{{ input }}</span>
			</button>
		</div>
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
		margin-top: 1.5rem;
	}

	.picker-label {
		font-size: 0.85rem;
		color: #555;
		margin-right: 0.2rem;
	}

	.font-btn {
		display: inline-flex;
		align-items: center;
		padding: 0.5rem 0.9rem;
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

	.font-btn-sample {
		font-size: 1.4rem;
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

	.dialect-picker {
		display: flex;
		gap: 0.3rem;
	}

	.dialect-btn {
		padding: 0.2rem 0.6rem;
		border: 1px solid #c8c8c8;
		border-radius: 0.3rem;
		background: #fff;
		color: #1a1a1a;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.dialect-btn.active {
		border-color: #1a1a1a;
		background: #1a1a1a;
		color: #fff;
	}

	.pron-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.3rem;
	}

	svg {
		display: block;
		max-width: 100%;
	}

	.glyph-path {
		/* bounding-box so the whole glyph rect is hoverable — keeps body and
		   any disjoint subpaths highlighted together when a single glyph
		   has multiple subpaths in its `d` attribute. */
		pointer-events: bounding-box;
		cursor: pointer;
		transition: fill 0.1s;
		fill: #000;
	}

	.glyph-path.missing { fill: #cc0000; }

	/* Hover and selection apply at the cluster <g> level so multi-glyph
	   units (e.g. Tajawal's body + dot for ب) highlight together. Selected
	   wins over hover via source order. */
	.glyph-cluster:hover .glyph-path {
		fill: #2a73d3;
	}

	.glyph-cluster.selected .glyph-path,
	.glyph-cluster.selected:hover .glyph-path {
		fill: #d33b2a;
	}

	.info-panel {
		margin-top: 1rem;
		border: 1px solid #c8c8c8;
		border-radius: 0.5rem;
		background: #fafafa;
		max-width: 720px;
	}

	.panel-body {
		padding: 0.9rem;
		color: #1a1a1a;
		font-size: 0.95rem;
	}

	.panel-nav {
		display: flex;
		justify-content: flex-end;
		gap: 0.4rem;
		margin-bottom: 0.6rem;
	}

	.panel-letter-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.6rem;
	}

	.letter-info { flex: 1; }

	.nav-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.7rem;
		border: 1px solid #c8c8c8;
		border-radius: 0.4rem;
		background: #fff;
		color: #1a1a1a;
		cursor: pointer;
		font-size: 0.95rem;
	}

	.nav-btn:hover:not(:disabled) {
		background: #f1f1f1;
		border-color: #888;
	}

	.nav-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.nav-arrow {
		font-size: 1.1rem;
		color: #555;
	}

	.nav-preview {
		font-size: 1.4rem;
		direction: rtl;
		min-width: 1.5rem;
		text-align: center;
	}

	.panel-letter {
		font-size: 3.5rem;
		line-height: 1;
		min-width: 4rem;
		text-align: center;
		direction: rtl;
	}

	.letter-name {
		font-size: 1.05rem;
		font-weight: 600;
		margin-bottom: 0.2rem;
	}

	.letter-kind {
		display: inline-block;
		margin-left: 0.4rem;
		padding: 0.05rem 0.4rem;
		border-radius: 0.2rem;
		background: #e5e5e5;
		color: #555;
		font-size: 0.7rem;
		font-weight: 500;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		vertical-align: middle;
	}

	.letter-translit { font-size: 0.85rem; color: #444; }

	.forms-row {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
		margin-bottom: 0.8rem;
	}

	.form-cell {
		text-align: center;
		padding: 0.5rem;
		background: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 0.3rem;
	}

	.form-label {
		font-size: 0.7rem;
		color: #666;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.2rem;
	}

	.form-glyph {
		font-size: 1.8rem;
		line-height: 1.1;
		direction: rtl;
	}

	.pron-row {
		background: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 0.3rem;
		padding: 0.6rem 0.8rem;
	}

	.pron-label {
		font-size: 0.7rem;
		color: #666;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.2rem;
	}

	.pron-ipa {
		font-family: 'Courier New', monospace;
		font-size: 1.1rem;
		margin-bottom: 0.3rem;
	}

	.pron-desc { font-size: 0.9rem; line-height: 1.4; margin-bottom: 0.3rem; }

	.pron-examples { font-size: 0.85rem; color: #333; }

	.no-letter { color: #666; font-style: italic; }
</style>
