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
	if(testFeedbackTimer) clearTimeout(testFeedbackTimer);
});

// ── Panel mode ────────────────────────────────────────────
type PanelMode = 'teach' | 'test';
const panelMode = ref<PanelMode | null>(null);
watch(input, () => { panelMode.value = null; });

function enterTeachMode() {
	panelMode.value = 'teach';
	if(!selectedGlyph.value) {
		const firstUnit = glyphClusters.value[0];
		if(firstUnit?.glyphs[0]) selectedGlyph.value = firstUnit.glyphs[0];
	}
}

// ── Test mode ─────────────────────────────────────────────
// Letters from the current text in reading order, eligible for quizzing.
const testQueue = computed(() =>
	glyphClusters.value.flatMap(unit =>
		unit.glyphs
			.map(glyph => {
				const sel = resolveGlyphSelection(glyph, glyphs.value, input.value, letters);
				const c = sel.letterChar;
				if(!c) return null;
				const info = letters[c];
				if(!info || info.kind === 'extender') return null;
				// Skip non-phonemic marks (e.g. maddah) — only exclude if non-phonemic in both dialects
				if(info.pronunciation['palestinian'].ipa.startsWith('(') && info.pronunciation['lebanese'].ipa.startsWith('(')) return null;
				return { cluster: unit.cluster, char: c, glyphId: glyph.glyphId };
			})
			.filter((x): x is { cluster: number; char: string; glyphId: number } => x !== null)
	)
);

const testIndex = ref(0);

interface TestOption {
	char: string;
	ipa: string;
	testDescription: string;
	isCorrect: boolean;
}

const testFeedback = ref<{ char: string; status: 'correct' | 'wrong' } | null>(null);
let testFeedbackTimer: ReturnType<typeof setTimeout> | null = null;

const testTarget = computed(() =>
	panelMode.value === 'test' ? testQueue.value[testIndex.value] ?? null : null
);

const testOptionChars = ref<{ char: string; isCorrect: boolean }[]>([]);

const testOptionsShuffled = computed<TestOption[]>(() => {
	const d = dialect.value;
	return testOptionChars.value.map(({ char, isCorrect }) => {
		const info = letters[char];
		if(!info) return { char, ipa: '', testDescription: '', isCorrect };
		const pron = info.pronunciation[d];
		return { char, ipa: shortIpa(pron), testDescription: pron.testDescription, isCorrect };
	});
});

function isPhonemic(l: { pronunciation: Record<string, { ipa: string }> }, d: string): boolean {
	return !l.pronunciation[d]?.ipa.startsWith('(');
}

function shortIpa(pron: { ipa: string; ipaShort?: string }): string {
	return pron.ipaShort ?? pron.ipa.split(' or ')[0]!;
}

function rollTestOptions() {
	const target = testTarget.value;
	if(!target) { testOptionChars.value = []; return; }
	const targetInfo = letters[target.char];
	if(!targetInfo) { testOptionChars.value = []; return; }
	const d = dialect.value;
	const pron = targetInfo.pronunciation[d];
	// Distractors must be the same kind (consonant vs diacritic) and phonemic,
	// and distinct from the target's sound in the current dialect
	const pool = Object.values(letters).filter(l =>
		l.kind === targetInfo.kind &&
		l.char !== target.char &&
		isPhonemic(l, d) &&
		l.pronunciation[d].testDescription !== pron.testDescription
	);
	const distractorChars = [...pool]
		.sort(() => Math.random() - 0.5)
		.slice(0, 5)
		.map(l => ({ char: l.char, isCorrect: false as const }));
	testOptionChars.value = [...distractorChars, { char: target.char, isCorrect: true as const }]
		.sort(() => Math.random() - 0.5);
}

watch(testTarget, (target) => {
	testFeedback.value = null;
	if(target) selectTestTarget(target);
	rollTestOptions();
}, { immediate: true });

function selectTestTarget(target: { cluster: number; glyphId: number }) {
	const g = glyphs.value.find(g => g.cluster === target.cluster && g.glyphId === target.glyphId);
	if(g) selectedGlyph.value = g;
}

function enterTestMode() {
	testFeedback.value = null;
	const sel = selectedGlyph.value;
	const startIndex = sel
		? Math.max(0, testQueue.value.findIndex(t => t.cluster === sel.cluster))
		: 0;
	testIndex.value = startIndex;
	panelMode.value = 'test';
	// Synchronously select the first target so the highlight is immediate
	const target = testQueue.value[startIndex];
	if(target) selectTestTarget(target);
}

function testPrev() {
	if(testIndex.value > 0) testIndex.value--;
}

function testNext() {
	if(testIndex.value < testQueue.value.length - 1) testIndex.value++;
	else { panelMode.value = null; selectedGlyph.value = null; }
}

function onTestAnswer(opt: TestOption) {
	if(testFeedback.value) return;
	testFeedback.value = { char: opt.char, status: opt.isCorrect ? 'correct' : 'wrong' };
	if(testFeedbackTimer) clearTimeout(testFeedbackTimer);
	if(opt.isCorrect) {
		testFeedbackTimer = setTimeout(() => { testFeedback.value = null; testNext(); }, 600);
	} else {
		testFeedbackTimer = setTimeout(() => { testFeedback.value = null; }, 450);
	}
}
</script>
<template>
	<div class="shape_page" :style="{ '--current_arabic_font': fontFamily }">
		<h3>Marhaba! Paste arabic text to the box below and explore the script letter by letter.</h3>

		<WordInputRow v-model="input" />

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

		<div v-if="error" class="notice notice_danger">Error: {{ error.message }}</div>

		<div ref="canvasRef" class="shape_canvas" :class="{ test_mode: panelMode === 'test' }">
			<svg :width="layoutWidth" :height="layoutHeight" :viewBox="`0 0 ${layoutWidth} ${layoutHeight}`">
				<g :transform="`translate(${runOffsetX}, ${emPx + ASCENDER_SLACK_PX}) scale(1, -1)`">
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
		</div>

		<aside v-if="glyphs.length" class="info_panel">
			<div class="panel_body">
				<template v-if="panelMode === null">
					<div class="mode_chooser">
						<button type="button" class="mode_btn" @click="enterTeachMode">
							<span class="mode_btn_title">Teach me</span>
							<span class="mode_btn_sub">Explore letter by letter</span>
						</button>
						<button type="button" class="mode_btn" @click="enterTestMode">
							<span class="mode_btn_title">Test me</span>
							<span class="mode_btn_sub">Guess the pronunciation</span>
						</button>
					</div>
				</template>

				<template v-else-if="panelMode === 'teach'">
					<TeachPanel
						:selected-letter="selectedLetter"
						:has-selection="!!selection"
						:has-prev="!!prevUnit"
						:has-next="!!nextUnit"
						:prev-preview="prevPreview"
						:next-preview="nextPreview"
						:dialect="dialect"
						@prev="selectAdjacent(prevUnit)"
						@next="selectAdjacent(nextUnit)"
						@back="panelMode = null"
					/>
				</template>

				<template v-else-if="panelMode === 'test'">
					<TestPanel
						:test-index="testIndex"
						:test-queue-length="testQueue.length"
						:test-options="testOptionsShuffled"
						:test-feedback="testFeedback"
						@prev="testPrev"
						@next="testNext"
						@done="panelMode = null"
						@answer="onTestAnswer"
					/>
				</template>
			</div>
		</aside>

		<SettingsBar
			v-model:font="selectedFont"
			v-model:dialect="dialect"
			:font-options="fontOptions"
			:preview-text="input"
		/>
	</div>
</template>

<style scoped>
/* Page styles using Cursive design system tokens (defined in app/assets/tokens.css). */

.shape_page {
	display: flex;
	flex-direction: column;
	gap: 20px;
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
	cursor: default;
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



/* ── Mode chooser ─────────────────────────────────────── */
.mode_chooser {
	display: flex;
	gap: 12px;
}

.mode_btn {
	flex: 1 1 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 6px;
	padding: 22px 16px;
	background: var(--page_bg);
	border: 1px solid var(--subtle_stroke);
	border-radius: var(--r_3);
	cursor: pointer;
	transition: background-color .15s, border-color .15s;
	font-family: var(--f_ui);
}

.mode_btn:hover {
	background: var(--quiet_button_bg);
	border-color: var(--accent_primary);
}

.mode_btn_title {
	font-size: 16px;
	font-weight: 600;
	color: var(--primary_text);
}

.mode_btn_sub {
	font-size: 12px;
	color: var(--tertiary_text);
}


.shape_canvas.test_mode .glyph-path {
	pointer-events: none;
	cursor: default;
}

.shape_canvas.test_mode .glyph-cluster.selected .glyph-path,
.shape_canvas.test_mode .glyph-cluster.selected:hover .glyph-path {
	fill: var(--accent_honor);
	animation: test_glyph_pulse 1.4s ease-in-out infinite;
}


@keyframes test_glyph_pulse {
	0%, 100% { opacity: 1; }
	50% { opacity: 0.5; }
}

/* ── Responsive ───────────────────────────────────────── */

@media (max-width: 640px) {
	.shape_page { gap: 16px; }
	.panel_body { padding: 14px; }
	.notice { font-size: 12px; }
	.notice_preview { font-size: 1.2rem; }
	.mode_chooser { flex-direction: column; }
}
</style>
