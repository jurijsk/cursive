<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { letters } from '~/data/letters';
import { findVocalizableMatches, applySpellings } from '~/data/spellings';
import { useSettingsStore, type FontKey } from '~/stores/settings';
import { groupGlyphsIntoUnits, resolveGlyphSelection, letterPreviewInContext, findPrevBaseChar, findNextBaseChar } from '~/utils/glyphs';

definePageMeta({ key: 'cursive-page' });

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
const router = useRouter();
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
	// Vocalized examples — show how a word looks with full diacritics so
	// learners can see fatha, kasra, damma, sukun, shadda, tanwins, madda etc.
	{ label: 'kataba (he wrote)', text: 'كَتَبَ' },
	{ label: 'jameelah (beautiful)', text: 'جَمِيلَةٌ' }
];

const DESIRED_EM = 120; // preferred px em size when there's enough room
const MAX_EM = 200; // don't grow beyond this when text is short
const MIN_EM = 48; // don't shrink below this when text is long (canvas will scroll)
const CANVAS_PADDING = 16; // horizontal breathing room inside the canvas

// Container ref drives auto-fit: we measure available width and pick a scale
// that makes the shaped run fill it. ResizeObserver keeps us responsive.
const canvasRef = ref<HTMLDivElement | null>(null);
const canvasWidth = ref(800);
let resizeObserver: ResizeObserver | null = null;
onMounted(() => {
	if(!canvasRef.value) return;
	canvasWidth.value = canvasRef.value.clientWidth;
	resizeObserver = new ResizeObserver((entries) => {
		const w = entries[0]?.contentRect.width;
		if(w && w > 0) canvasWidth.value = w;
	});
	resizeObserver.observe(canvasRef.value);
});
onUnmounted(() => { resizeObserver?.disconnect(); });

const { data, refresh, error } = await useAsyncData<ShapeResult>('shape-text', () =>
	$fetch<ShapeResult>('/api/shape', { method: 'POST', body: { text: input.value, font: selectedFont.value } }),
{ watch: [] }
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
	const units = glyphClusters.value;
	if(units.length === 0) return null;
	const idx = currentUnitIndex.value;
	// No selection yet: only the reading-forward button is active and points
	// to the first cluster in reading order.
	if(idx < 0) return isRtl.value ? units[0] ?? null : null;
	const target = isRtl.value ? idx + 1 : idx - 1;
	return target >= 0 && target < units.length ? units[target] ?? null : null;
});
const rightUnit = computed(() => {
	const units = glyphClusters.value;
	if(units.length === 0) return null;
	const idx = currentUnitIndex.value;
	if(idx < 0) return isRtl.value ? null : units[0] ?? null;
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

// Re-shapes (font switch, reload) produce fresh glyph objects with new
// glyphIds. Re-anchor the current selection to the new array by cluster +
// role (letter vs. diacritic, distinguished by xAdvance) so the info panel
// stays open across font changes.
watch(glyphs, (next) => {
	const sg = selectedGlyph.value;
	if(!sg || next.length === 0) return;
	const isMark = sg.xAdvance === 0;
	const candidates = next.filter(g => g.cluster === sg.cluster);
	if(candidates.length === 0) {
		selectedGlyph.value = null;
		return;
	}
	const match = candidates.find(g => (g.xAdvance === 0) === isMark) ?? candidates[0]!;
	selectedGlyph.value = match;
});

// Total advance in font units across all glyphs.
const totalAdvanceUpm = computed(() =>
	glyphs.value.reduce((s, g) => s + (g.xAdvance || 0), 0)
);

// Scale picks the largest em size in [MIN_EM, MAX_EM] that fits the canvas
// width once the run is laid out. Falls back to DESIRED_EM when there are no
// glyphs yet (e.g. empty input). Adds horizontal slack for ink that extends
// outside the advance box (negative left side bearing on the first visual
// glyph, ink past xAdvance on the last) so we don't truncate at the edges.
const INK_OVERHANG_EM = 0.6; // ~30% of em on each side, expressed in em units
const scale = computed(() => {
	const upm = upem.value;
	const totalUpm = totalAdvanceUpm.value;
	if(totalUpm <= 0) return DESIRED_EM / upm;
	const available = Math.max(0, canvasWidth.value - CANVAS_PADDING * 2);
	const denomUpm = totalUpm + INK_OVERHANG_EM * upm;
	const fitEm = (available / denomUpm) * upm;
	const em = Math.max(MIN_EM, Math.min(MAX_EM, fitEm));
	return em / upm;
});

const emPx = computed(() => Math.round(upem.value * scale.value));
// Vertical box: Amiri's stacked marks can rise higher than the other fonts,
// so keep the original baseline placement but add more total headroom.
const VERTICAL_HEADROOM_EM = 1.65;
const VERTICAL_PADDING_PX = 16;
// Extra pixels reserved above the baseline for Amiri stacked/high diacritics.
const ASCENDER_SLACK_PX = 64;
// Keep a small right safety margin for glyph ink that extends beyond advance,
// but avoid visually large gaps near the right canvas edge.
const RIGHT_EDGE_SLACK_EM = 0.08;
const layoutHeight = computed(() => Math.round(emPx.value * VERTICAL_HEADROOM_EM + VERTICAL_PADDING_PX + ASCENDER_SLACK_PX));
const runWidthPx = computed(() => totalAdvanceUpm.value * scale.value + INK_OVERHANG_EM * emPx.value);
const layoutWidth = computed(() => Math.max(canvasWidth.value, runWidthPx.value + CANVAS_PADDING * 2));

// Right-align: shift the run so its rightmost edge sits at canvas right minus
// padding. HarfBuzz lays glyphs out starting at x=0 with non-negative
// positions, so the run's visual extent is totalAdvanceUpm * scale plus a
// half-em of ink-overhang slack on the right.
const runOffsetX = computed(() => {
	const runAdvancePx = totalAdvanceUpm.value * scale.value;
	const rightSlack = RIGHT_EDGE_SLACK_EM * emPx.value;
	return Math.max(CANVAS_PADDING, layoutWidth.value - CANVAS_PADDING - rightSlack - runAdvancePx);
});
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

let shapeTimer: ReturnType<typeof setTimeout> | null = null;
watch([input, selectedFont], () => {
	if(shapeTimer) clearTimeout(shapeTimer);
	shapeTimer = setTimeout(() => {
		refresh();
	}, 200);
});

let urlTimer: ReturnType<typeof setTimeout> | null = null;
watch(input, () => {
	if(urlTimer) clearTimeout(urlTimer);
	urlTimer = setTimeout(() => {
		router.replace({ params: { text: input.value } });
	}, 600);
});

onUnmounted(() => {
	if(shapeTimer) clearTimeout(shapeTimer);
	if(urlTimer) clearTimeout(urlTimer);
});

// ── Quiz mode ─────────────────────────────────────────────
// "Test your knowledge": pick base letters (no diacritics) from the current
// input in reading order; user types each one on the on-screen keyboard.
const quizActive = ref(false);
const quizIndex = ref(0);
const quizFeedback = ref<{ char: string; status: 'correct' | 'wrong' } | null>(null);
let feedbackTimer: ReturnType<typeof setTimeout> | null = null;

// Cluster groups in reading order whose first glyph is a base letter (not a
// combining mark). Diacritics are skipped — they're harder to identify in
// isolation and the keyboard places them on a separate row.
const quizQueue = computed(() => {
	return glyphClusters.value
		.map(unit => {
			const baseGlyph = unit.glyphs.find(g => g.xAdvance > 0) ?? unit.glyphs[0];
			if(!baseGlyph) return null;
			const sel = resolveGlyphSelection(baseGlyph, glyphs.value, input.value, letters);
			const c = sel.letterChar;
			if(!c) return null;
			const info = letters[c];
			if(!info || info.kind === 'diacritic') return null;
			return { cluster: unit.cluster, char: c };
		})
		.filter((x): x is { cluster: number; char: string } => x !== null);
});

const quizTarget = computed(() => quizActive.value ? quizQueue.value[quizIndex.value] ?? null : null);

function startQuiz() {
	if(quizQueue.value.length === 0) return;
	quizActive.value = true;
	quizIndex.value = 0;
	quizFeedback.value = null;
	selectedGlyph.value = null;
}

function stopQuiz() {
	quizActive.value = false;
	quizFeedback.value = null;
}

function quizPrev() {
	if(quizIndex.value > 0) quizIndex.value--;
	quizFeedback.value = null;
}

function quizNext() {
	if(quizIndex.value < quizQueue.value.length - 1) quizIndex.value++;
	else stopQuiz(); // finished — close keyboard
	quizFeedback.value = null;
}

function flashFeedback(char: string, status: 'correct' | 'wrong') {
	if(feedbackTimer) clearTimeout(feedbackTimer);
	quizFeedback.value = { char, status };
	feedbackTimer = setTimeout(() => { quizFeedback.value = null; }, 450);
}

function onKeyboardKey(char: string) {
	const target = quizTarget.value;
	if(!target) return;
	if(char === target.char) {
		flashFeedback(char, 'correct');
		setTimeout(() => quizNext(), 350);
	} else {
		flashFeedback(char, 'wrong');
	}
}

// Reset quiz when input changes (queue is no longer valid).
watch(input, () => { stopQuiz(); });
</script>
<template>
	<div class="shape_page" :style="{ '--current_arabic_font': fontFamily }">
		<header class="hero">
			<div class="label-eyebrow">Type · shape · explore</div>
			<h1>Type Arabic, see how it shapes.</h1>
			<p class="hero_lede">Watch each letter take its initial, medial, final, or isolated form. Click any glyph to learn its name, sound, and forms.</p>
		</header>

		<div class="field">
			<label for="shape_input" class="field_label">Text</label>
			<input id="shape_input" v-model="input" class="text_input ar" dir="rtl" >
		</div>

		<div v-if="hasLigature" class="notice notice_saffron">
			<span>Contains a ligature character. Decomposed:</span>
			<strong class="notice_preview ar">{{ normalized }}</strong>
			<button type="button" class="btn btn_quiet btn_sm" @click="applyNormalized">Replace</button>
		</div>
		<div v-if="vocalizableMatches.length" class="notice notice_saffron">
			<span>Add canonical diacritics ({{ vocalizableMatches.map(m => m.note.split(' — ')[0]).join(', ') }}):</span>
			<strong class="notice_preview ar">{{ vocalizedPreview }}</strong>
			<button type="button" class="btn btn_quiet btn_sm" @click="applyVocalization">Add diacritics</button>
		</div>
		<div v-if="hasMissingGlyphs" class="notice notice_danger">
			This font doesn't have glyphs for some characters in the text. Try a different font.
		</div>

		<section class="examples_section">
			<div class="label-eyebrow">Try one</div>
			<div class="examples">
				<button v-for="ex in examples" :key="ex.text" type="button" class="example_chip" @click="input = ex.text">
					<span class="ex_text ar">{{ ex.text }}</span>
					<span class="ex_label">{{ ex.label }}</span>
				</button>
			</div>
		</section>

		<div v-if="error" class="notice notice_danger">Error: {{ error.message }}</div>

		<div ref="canvasRef" class="shape_canvas">
		<svg :width="layoutWidth" :height="layoutHeight" :viewBox="`0 0 ${layoutWidth} ${layoutHeight}`">
			<g :transform="`translate(${runOffsetX}, ${emPx + ASCENDER_SLACK_PX}) scale(1, -1)`">
				<g v-for="(group, ui) in glyphClusters" :key="ui" :class="{ 'glyph-cluster': true, selected: ui === currentUnitIndex, quiz_target: quizTarget && group.cluster === quizTarget.cluster }" :data-cluster="group.cluster">
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
		</div>

		<aside v-if="glyphs.length" class="info_panel">
			<div class="panel_body">
				<div class="panel_nav">
					<button
						type="button"
						class="nav_btn"
						:disabled="!prevUnit"
						@click="selectAdjacent(prevUnit)"
					>
						<span class="nav_arrow">←</span>
						<span class="nav_preview">{{ prevPreview }}</span>
					</button>
					<button
						type="button"
						class="nav_btn"
						:disabled="!nextUnit"
						@click="selectAdjacent(nextUnit)"
					>
						<span class="nav_preview">{{ nextPreview }}</span>
						<span class="nav_arrow">→</span>
					</button>
				</div>
				<template v-if="selectedLetter">
					<div class="letter_row">
						<span class="hero_letter ar">{{ selectedLetter.kind === 'diacritic' ? 'ـ' + selectedLetter.char : selectedLetter.char }}</span>
						<div class="letter_info">
							<div class="letter_name">
								{{ selectedLetter.name }} <span class="letter_arabic_name">({{ selectedLetter.arabicName }})</span>
								<span class="badge" :class="selectedLetter.kind === 'diacritic' ? 'badge_saffron' : 'badge_sage'">{{ selectedLetter.kind }}</span>
							</div>
							<div class="letter_translit"><span class="label-eyebrow">Transliteration</span> {{ selectedLetter.transliteration.join(', ') }}</div>
						</div>
					</div>
					<div v-if="selectedLetter.kind === 'letter' || selectedLetter.kind === 'diacritic'" class="forms_row">
						<template v-if="selectedLetter.kind === 'letter'">
							<div class="form_cell">
								<div class="form_label">isolated</div>
								<div class="form_glyph ar">{{ selectedLetter.forms.isolated }}</div>
							</div>
							<div class="form_cell">
								<div class="form_label">initial</div>
								<div class="form_glyph ar">{{ selectedLetter.forms.initial }}</div>
							</div>
							<div class="form_cell">
								<div class="form_label">medial</div>
								<div class="form_glyph ar">{{ selectedLetter.forms.medial }}</div>
							</div>
							<div class="form_cell">
								<div class="form_label">final</div>
								<div class="form_glyph ar">{{ selectedLetter.forms.final }}</div>
							</div>
						</template>
						<div v-else class="form_cell form_cell_message">
							<div class="form_label">forms</div>
							<div class="form_message">Diacritics do not have letter forms.</div>
						</div>
					</div>
					<div class="pron_card">
						<div class="pron_header">
							<div class="label-eyebrow">Pronunciation</div>
							<div class="dialect_picker">
								<button
									type="button"
									class="dialect_btn"
									:class="{ active: dialect === 'palestinian' }"
									@click="dialect = 'palestinian'"
								>Palestinian</button>
								<button
									type="button"
									class="dialect_btn"
									:class="{ active: dialect === 'lebanese' }"
									@click="dialect = 'lebanese'"
								>Lebanese</button>
							</div>
						</div>
						<div class="pron_ipa">{{ selectedLetter.pronunciation[dialect].ipa }}</div>
						<div class="pron_desc">{{ selectedLetter.pronunciation[dialect].description }}</div>
						<div v-if="selectedLetter.pronunciation[dialect].englishExamples.length" class="pron_examples">
							<span class="label-eyebrow">English examples</span>
							<span>{{ selectedLetter.pronunciation[dialect].englishExamples.join(', ') }}</span>
						</div>
					</div>
				</template>
				<div v-else-if="selection" class="no_letter">No letter information available for this glyph.</div>
				<template v-else>
					<div class="info_hint">Click any letter above to see its name, sound, and contextual forms.</div>
					<button v-if="!quizActive && quizQueue.length" type="button" class="quiz_cta" @click="startQuiz">
						<span class="quiz_cta_label">Or test your knowledge</span>
						<span class="quiz_cta_sub">Type the letters you can recognize.</span>
					</button>
				</template>
				<div v-if="quizActive" class="quiz_panel">
					<div class="quiz_header">
						<div class="label-eyebrow">Quiz</div>
						<div class="quiz_progress">{{ quizIndex + 1 }} / {{ quizQueue.length }}</div>
						<button type="button" class="btn btn_quiet btn_sm" @click="stopQuiz">Done</button>
					</div>
					<p class="quiz_prompt">Type the highlighted letter on the keyboard.</p>
					<OnScreenKeyboard
						:target-char="quizTarget?.char ?? null"
						:feedback="quizFeedback"
						@key="onKeyboardKey"
						@left="isRtl ? quizNext() : quizPrev()"
						@right="isRtl ? quizPrev() : quizNext()"
					/>
				</div>
			</div>
		</aside>

		<section class="font_picker_section">
			<div class="label-eyebrow">Font</div>
			<div class="font_picker">
				<button
					v-for="f in fontOptions"
					:key="f.key"
					type="button"
					class="font_btn"
					:class="{ active: selectedFont === f.key }"
					@click="selectedFont = f.key"
				>
					<span class="font_btn_sample ar" :style="{ fontFamily: f.family }">{{ input }}</span>
					<span class="font_btn_label">{{ f.label }}</span>
				</button>
			</div>
		</section>
	</div>
</template>

<style scoped>
/* Page styles using Cursive design system tokens (defined in app/assets/tokens.css). */

.shape_page {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.hero {
	margin-bottom: 4px;
}

.hero h1 {
	font-family: var(--f_display);
	font-weight: 400;
	font-size: clamp(2rem, 4vw, 2.75rem);
	letter-spacing: -0.02em;
	margin: 6px 0 6px;
}

.hero_lede {
	font-size: 14px;
	color: var(--secondary_text);
	max-width: 56ch;
	line-height: 1.55;
	margin: 0;
}

/* ── Field ─────────────────────────────────────────────── */
.field {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.field_label {
	font-size: 12px;
	font-weight: 500;
	color: var(--secondary_text);
}

.text_input {
	height: 56px;
	padding: 0 16px;
	border-radius: var(--r_3);
	background: var(--field_bg);
	border: 1px solid var(--field_border);
	box-shadow: var(--e_inset);
	font-size: 22px;
	color: var(--primary_text);
	direction: rtl;
	transition: border-color .15s, box-shadow .15s;
	outline: none;
	width: 100%;
}

.text_input:focus {
	border-color: var(--focus_field_border);
	box-shadow: 0 0 0 3px var(--focus_field_ring);
}

/* ── Notice cards ──────────────────────────────────────── */
.notice {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 12px;
	padding: 12px 16px;
	border-radius: var(--r_3);
	font-size: 13px;
	line-height: 1.45;
}

.notice_saffron {
	background: var(--badge_saffron_bg);
	border: 1px solid var(--accent_honor_quiet);
	color: var(--badge_saffron_text);
}

.notice_danger {
	background: var(--error_quiet_bg);
	border: 1px solid var(--danger_button_border);
	color: var(--error_color);
}

.notice_preview {
	font-size: 1.4rem;
	color: var(--primary_text);
	direction: rtl;
}

/* ── Buttons ───────────────────────────────────────────── */
.btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	height: 36px;
	padding: 0 14px;
	font-family: var(--f_ui);
	font-size: 13px;
	font-weight: 500;
	letter-spacing: -0.005em;
	border-radius: var(--r_button);
	cursor: pointer;
	transition: background-color .15s, border-color .15s, color .15s;
	text-decoration: none;
}

.btn_sm { height: 30px; padding: 0 12px; font-size: 12px; }

.btn_primary {
	background: var(--primary_button_bg);
	color: var(--primary_button_text);
	border: 1px solid var(--primary_button_border);
	box-shadow: var(--e_1);
}
.btn_primary:hover { background: var(--hover_primary_button_bg); }

.btn_secondary {
	background: var(--secondary_button_bg);
	color: var(--secondary_button_text);
	border: 1px solid var(--secondary_button_border);
}
.btn_secondary:hover { background: var(--hover_secondary_button_bg); }

.btn_quiet {
	background: var(--quiet_button_bg);
	color: var(--quiet_button_text);
	border: 1px solid var(--quiet_button_border);
}
.btn_quiet:hover { background: var(--hover_quiet_button_bg); }

.btn:disabled {
	opacity: .4;
	cursor: not-allowed;
}

/* ── Examples / chips ──────────────────────────────────── */
.examples_section {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.examples {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.example_chip {
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	gap: 2px;
	padding: 8px 14px;
	background: var(--surface_bg);
	border: 1px solid var(--subtle_stroke);
	border-radius: var(--r_3);
	color: var(--primary_text);
	cursor: pointer;
	transition: background-color .15s, border-color .15s;
}

.example_chip:hover {
	background: var(--quiet_button_bg);
	border-color: var(--quiet_button_border);
}

.ex_text {
	font-size: 1.35rem;
	color: var(--primary_text);
	direction: rtl;
}

.ex_label {
	font-family: var(--f_mono);
	font-size: 10px;
	letter-spacing: 0.02em;
	color: var(--tertiary_text);
}

/* ── Shape canvas ──────────────────────────────────────── */
.shape_canvas {
	background: var(--surface_bg);
	border: 1px solid var(--subtle_stroke);
	border-radius: var(--r_4);
	box-shadow: var(--e_1);
	overflow: hidden;
	/* Padding lives inside the SVG layout (CANVAS_PADDING) so the
	   measured clientWidth equals the drawing area exactly. */
}

svg {
	display: block;
	max-width: 100%;
}

.glyph-path {
	pointer-events: bounding-box;
	cursor: pointer;
	transition: fill 0.1s;
	fill: var(--primary_text);
}

.glyph-path.missing { fill: var(--error_color); }

.glyph-cluster:hover .glyph-path { fill: var(--success_color); }

.glyph-cluster.selected .glyph-path,
.glyph-cluster.selected:hover .glyph-path {
	fill: var(--accent_honor);
}

.glyph-cluster.quiz_target .glyph-path {
	fill: var(--accent_honor);
	animation: quiz_pulse 1.4s ease-in-out infinite;
}

@keyframes quiz_pulse {
	0%, 100% { opacity: 1; }
	50% { opacity: 0.55; }
}

/* ── Info panel ────────────────────────────────────────── */
.info_panel {
	background: var(--surface_bg);
	border: 1px solid var(--subtle_stroke);
	border-radius: var(--r_4);
	box-shadow: var(--e_1);
}

.panel_body {
	padding: 18px;
	display: flex;
	flex-direction: column;
	gap: 14px;
}

.panel_nav {
	display: flex;
	justify-content: flex-end;
	gap: 8px;
}

.nav_btn {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 6px 12px;
	border: 1px solid var(--secondary_button_border);
	border-radius: var(--r_2);
	background: var(--secondary_button_bg);
	color: var(--secondary_button_text);
	cursor: pointer;
	font-size: 13px;
	transition: background-color .15s, border-color .15s;
}

.nav_btn:hover:not(:disabled) {
	background: var(--hover_secondary_button_bg);
}

.nav_btn:disabled {
	opacity: 0.35;
	cursor: not-allowed;
}

.nav_arrow {
	font-size: 14px;
	color: var(--tertiary_text);
}

.nav_preview {
	font-family: var(--current_arabic_font), var(--f_arabic);
	font-size: 1.6rem;
	display: inline-block;
	line-height: 1.3;
	padding-block: 0.12em 0.04em;
	direction: rtl;
	min-width: 1.5rem;
	text-align: center;
	color: var(--primary_text);
}

.letter_row {
	display: flex;
	align-items: center;
	gap: 18px;
	min-width: 0;
}

.letter_info {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.hero_letter {
	font-size: 4rem;
	line-height: 1;
	min-width: 4.5rem;
	text-align: center;
	color: var(--accent_primary_hi);
}

.letter_name {
	font-family: var(--f_display);
	font-size: clamp(0.95rem, 2.6vw, 1.25rem);
	font-weight: 500;
	display: flex;
	align-items: center;
	flex-wrap: nowrap;
	white-space: nowrap;
	gap: 8px;
	min-width: 0;
}

.letter_arabic_name {
	color: var(--secondary_text);
	font-weight: 400;
	overflow: hidden;
	text-overflow: ellipsis;
	min-width: 0;
}

.badge {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	flex-shrink: 0;
	font-family: var(--f_ui);
	font-size: 11px;
	font-weight: 500;
	padding: 3px 10px;
	border-radius: var(--r_pill);
	text-transform: lowercase;
	letter-spacing: 0.02em;
}

.badge_sage {
	background: var(--badge_sage_bg);
	color: var(--badge_sage_text);
}

.badge_saffron {
	background: var(--badge_saffron_bg);
	color: var(--badge_saffron_text);
}

.letter_translit {
	font-size: 13px;
	color: var(--secondary_text);
	display: flex;
	gap: 8px;
	align-items: baseline;
}

.forms_row {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	grid-auto-rows: 1fr;
	gap: clamp(4px, 1.5vw, 10px);
	min-height: clamp(72px, 9vw, 88px);
}

.form_cell {
	text-align: center;
	padding: clamp(6px, 2vw, 12px) clamp(2px, 1vw, 8px);
	background: var(--page_bg);
	border: 1px solid var(--subtle_stroke);
	border-radius: var(--r_3);
	min-width: 0;
	height: 100%;
}

.form_cell_message {
	grid-column: 1 / -1;
	padding-inline: clamp(10px, 2.6vw, 16px);
	display: flex;
	flex-direction: column;
	justify-content: center;
}

.form_label {
	font-family: var(--f_mono);
	font-size: 10px;
	color: var(--tertiary_text);
	text-transform: uppercase;
	letter-spacing: 0.12em;
	margin-bottom: 4px;
}

.form_glyph {
	font-size: 1.9rem;
	line-height: 1.1;
	color: var(--primary_text);
}

.form_message {
	font-size: 13px;
	line-height: 1.4;
	color: var(--secondary_text);
}

.pron_card {
	background: var(--page_bg);
	border: 1px solid var(--subtle_stroke);
	border-radius: var(--r_3);
	padding: 14px 16px;
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.pron_header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-wrap: nowrap;
	gap: 12px;
	min-width: 0;
	margin-bottom: 4px;
}

.pron_header > .label-eyebrow {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	min-width: 0;
}

.dialect_picker {
	display: flex;
	flex-wrap: nowrap;
	gap: 4px;
	background: var(--surface_bg);
	border: 1px solid var(--subtle_stroke);
	border-radius: var(--r_pill);
	padding: 3px;
	flex-shrink: 0;
}

.dialect_btn {
	padding: 4px clamp(8px, 2.4vw, 12px);
	border: none;
	border-radius: var(--r_pill);
	background: transparent;
	color: var(--secondary_text);
	font-size: clamp(11px, 2.4vw, 12px);
	font-weight: 500;
	white-space: nowrap;
	cursor: pointer;
	transition: background-color .15s, color .15s;
}

.dialect_btn.active {
	background: var(--accent_primary);
	color: var(--on_primary_text);
}

.pron_ipa {
	font-family: var(--f_mono);
	font-size: 1rem;
	color: var(--primary_text);
}

.pron_desc {
	font-size: 13px;
	color: var(--secondary_text);
	line-height: 1.5;
}

.pron_examples {
	font-size: 12px;
	color: var(--secondary_text);
	display: flex;
	gap: 8px;
	align-items: baseline;
}

.no_letter {
	color: var(--tertiary_text);
	font-style: italic;
}

.info_hint {
	color: var(--secondary_text);
	font-size: 14px;
	line-height: 1.5;
	padding: 16px;
	background: var(--surface_bg);
	border: 1px dashed var(--subtle_stroke);
	border-radius: var(--r_3);
	text-align: center;
}

.quiz_cta {
	display: flex;
	flex-direction: column;
	gap: 4px;
	align-items: center;
	padding: 14px 16px;
	margin-top: 12px;
	background: var(--page_bg);
	border: 1px solid var(--accent_primary);
	border-radius: var(--r_3);
	color: var(--primary_text);
	cursor: pointer;
	transition: background-color .15s, color .15s;
	width: 100%;
	font-family: var(--f_ui);
}

.quiz_cta:hover {
	background: var(--accent_primary);
	color: var(--inverse_text);
}

.quiz_cta_label {
	font-size: 15px;
	font-weight: 600;
}

.quiz_cta_sub {
	font-size: 13px;
	opacity: 0.85;
}

.quiz_panel {
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin-top: 12px;
}

.quiz_header {
	display: flex;
	align-items: center;
	gap: 12px;
}

.quiz_progress {
	flex: 1;
	font-family: var(--f_mono);
	font-size: 13px;
	color: var(--secondary_text);
}

.quiz_prompt {
	margin: 0;
	font-size: 13px;
	color: var(--secondary_text);
}

/* ── Font picker ───────────────────────────────────────── */
.font_picker_section {
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin-top: 4px;
}

.font_picker {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.font_btn {
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
	padding: 10px 14px;
	border: 1px solid var(--subtle_stroke);
	border-radius: var(--r_3);
	background: var(--surface_bg);
	color: var(--primary_text);
	cursor: pointer;
	transition: background-color .15s, border-color .15s;
}

.font_btn:hover {
	background: var(--quiet_button_bg);
	border-color: var(--quiet_button_border);
}

.font_btn.active {
	background: var(--inverse_surface_bg);
	border-color: var(--inverse_surface_bg);
	color: var(--inverse_text);
}

.font_btn_sample {
	font-size: 1.4rem;
	direction: rtl;
}

.font_btn_label {
	font-family: var(--f_mono);
	font-size: 10px;
	letter-spacing: 0.02em;
	color: inherit;
	opacity: .75;
}

/* ── Responsive ───────────────────────────────── */
@media (max-width: 640px) {
	.shape_page { gap: 16px; }
	.hero h1 { font-size: clamp(1.5rem, 6vw, 2rem); }
	.text_input { height: 48px; font-size: 18px; padding: 0 12px; }
	.panel_body { padding: 14px; }
	.letter_row { gap: 12px; }
	.hero_letter {
		font-size: 3rem;
		flex-shrink: 0;
	}
	.pron_header {
		flex-wrap: nowrap;
		gap: 8px;
	}
	.dialect_picker { flex-wrap: nowrap; }
	.notice { font-size: 12px; }
	.notice_preview { font-size: 1.2rem; }
	.form_glyph { font-size: clamp(1.2rem, 5.5vw, 1.6rem); }
}

@media (max-width: 420px) {
	.hero_letter { font-size: 2.5rem; }
	.letter_name { font-size: 1.1rem; }
	.nav_btn { padding: 6px 10px; }
	.nav_preview { font-size: 1.3rem; }
}
</style>
