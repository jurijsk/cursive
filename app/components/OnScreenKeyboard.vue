<script setup lang="ts">
// Generic on-screen keyboard. Layout is data-driven so layouts can be swapped
// via prop or selected from the built-in set with the tab strip.
// `feedback` lets the parent flash a key green or red for quiz feedback.

interface Key {
	char: string;          // character emitted on press
	display?: string;      // optional override for rendering (e.g., diacritics on a tatweel)
	wide?: boolean;        // takes 1.5× width (multi-char transliteration glyphs)
}

interface KeyboardLayout {
	name: string;
	// 'arabic'  → keys rendered with the Arabic font class
	// 'latin'   → keys rendered with UI font (transliteration / phonetic)
	display_script?: 'arabic' | 'latin';
	rows: Key[][];
}

// ─── Layout data ──────────────────────────────────────────────────────────────
// Each layout is a plain const so it can be moved to a data file and imported.
// Convention: the LAST row of `rows` is always the diacritics strip.

// Standard Arabic 101 layout (Mac/Windows). Row order matches physical QWERTY
// so muscle memory transfers.
const arabicLayout: KeyboardLayout = {
	name: 'Arabic',
	display_script: 'arabic',
	rows: [
		[
			{ char: 'ض' }, { char: 'ص' }, { char: 'ث' }, { char: 'ق' }, { char: 'ف' },
			{ char: 'غ' }, { char: 'ع' }, { char: 'ه' }, { char: 'خ' }, { char: 'ح' },
			{ char: 'ج' }, { char: 'د' }
		],
		[
			{ char: 'ش' }, { char: 'س' }, { char: 'ي' }, { char: 'ب' }, { char: 'ل' },
			{ char: 'ا' }, { char: 'ت' }, { char: 'ن' }, { char: 'م' }, { char: 'ك' },
			{ char: 'ط' }
		],
		[
			{ char: 'ئ' }, { char: 'ء' }, { char: 'ؤ' }, { char: 'ر' }, { char: 'ى' },
			{ char: 'ة' }, { char: 'و' }, { char: 'ز' }, { char: 'ظ' }
		],
		// diacritics row (last by convention)
		[
			{ char: 'ـَ', display: 'ـَ' }, { char: 'ـِ', display: 'ـِ' },
			{ char: 'ـُ', display: 'ـُ' }, { char: 'ـْ', display: 'ـْ' },
			{ char: 'ـّ', display: 'ـّ' }, { char: 'ـً', display: 'ـً' },
			{ char: 'ـٍ', display: 'ـٍ' }, { char: 'ـٌ', display: 'ـٌ' }
		]
	]
};

// Phonetic layout — letters grouped by place/manner of articulation.
// Keys display simplified IPA; pressing a key still emits the Arabic character.
const phoneticLayout: KeyboardLayout = {
	name: 'Phonetic',
	display_script: 'latin',
	rows: [
		// labials + interdentals
		[
			{ char: 'ب', display: 'b' }, { char: 'ت', display: 't' },
			{ char: 'ث', display: 'θ' }, { char: 'د', display: 'd' },
			{ char: 'ذ', display: 'ð' }, { char: 'ف', display: 'f' },
			{ char: 'م', display: 'm' }, { char: 'و', display: 'w' }
		],
		// sibilants + liquids + nasals
		[
			{ char: 'س', display: 's' }, { char: 'ص', display: 'sˤ', wide: true },
			{ char: 'ز', display: 'z' }, { char: 'ش', display: 'ʃ' },
			{ char: 'ج', display: 'ʒ' }, { char: 'ر', display: 'r' },
			{ char: 'ل', display: 'l' }, { char: 'ن', display: 'n' }
		],
		// velars + uvulars + pharyngeals + laryngeals
		[
			{ char: 'ك', display: 'k' }, { char: 'ق', display: 'q' },
			{ char: 'خ', display: 'x' }, { char: 'غ', display: 'ɣ' },
			{ char: 'ح', display: 'ħ' }, { char: 'ع', display: 'ʕ' },
			{ char: 'ه', display: 'h' }, { char: 'ء', display: 'ʔ' },
			{ char: 'ي', display: 'j' }
		],
		// emphatics + vowel-letters
		[
			{ char: 'ط', display: 'tˤ', wide: true }, { char: 'ض', display: 'dˤ', wide: true },
			{ char: 'ظ', display: 'zˤ', wide: true },
			{ char: 'ا', display: 'aː', wide: true }, { char: 'آ', display: 'ʔaː', wide: true },
			{ char: 'ى', display: 'aː', wide: true }, { char: 'ة', display: 'a' },
			{ char: 'ؤ', display: 'ʔ' }, { char: 'ئ', display: 'ʔ' }
		],
		// diacritics row (last by convention)
		[
			{ char: 'ـَ', display: 'a' }, { char: 'ـِ', display: 'i' },
			{ char: 'ـُ', display: 'u' }, { char: 'ـْ', display: '∅' },
			{ char: 'ـّ', display: '×2', wide: true },
			{ char: 'ـً', display: 'an', wide: true }, { char: 'ـٍ', display: 'in', wide: true },
			{ char: 'ـٌ', display: 'un', wide: true }
		]
	]
};

type TransliterationMode = 'chat' | 'buckwalter' | 'academic';

const transliterationModeOptions: ReadonlyArray<{ id: TransliterationMode; label: string }> = [
	{ id: 'chat', label: 'Chat' },
	{ id: 'buckwalter', label: 'Buck' },
	{ id: 'academic', label: 'Acad' }
];

// Translit variants share the same Arabic output; only key labels change.
// Rows follow English QWERTY sound-mapping: each Arabic letter sits at the key
// whose Latin letter most closely matches its transliteration sound.
// Row 1 = Q-W-E(ع)-R-T-Y … Row 2 = A-S-D-F-G(غ)-H-J-K-L … Row 3 = Z-B-N-M …
const transliterationLayouts: Record<TransliterationMode, KeyboardLayout> = {
	chat: {
		name: 'Translit',
		display_script: 'latin',
		rows: [
			// q  w  (e=ع/3)  r  t  y  — then digraphs and gutturals filling P-O-I-U area
			[
				{ char: 'ق', display: 'q' }, { char: 'و', display: 'w' },
				{ char: 'ع', display: '3' }, { char: 'ر', display: 'r' },
				{ char: 'ت', display: 't' }, { char: 'ي', display: 'y' },
				{ char: 'ث', display: 'th', wide: true }, { char: 'ش', display: 'sh', wide: true },
				{ char: 'خ', display: 'kh', wide: true }, { char: 'ح', display: '7' },
				{ char: 'ء', display: '2' }
			],
			// a  s  d  f  (g=غ/gh)  h  j  k  l  — emphatics at end
			[
				{ char: 'ا', display: 'aa', wide: true }, { char: 'س', display: 's' },
				{ char: 'د', display: 'd' }, { char: 'ف', display: 'f' },
				{ char: 'غ', display: 'gh', wide: true }, { char: 'ه', display: 'h' },
				{ char: 'ج', display: 'j' }, { char: 'ك', display: 'k' },
				{ char: 'ل', display: 'l' }, { char: 'ص', display: 'S' },
				{ char: 'ض', display: 'D' }
			],
			// z  b  n  m  — emphatics, then variant forms
			[
				{ char: 'ز', display: 'z' }, { char: 'ب', display: 'b' },
				{ char: 'ن', display: 'n' }, { char: 'م', display: 'm' },
				{ char: 'ط', display: 'T' }, { char: 'ظ', display: 'Z' },
				{ char: 'ة', display: 'a' }, { char: 'ى', display: 'aa', wide: true },
				{ char: 'ئ', display: '2i', wide: true }, { char: 'ؤ', display: '2u', wide: true },
				{ char: 'آ', display: '2aa', wide: true }
			],
			[
				{ char: 'ـَ', display: 'a' }, { char: 'ـِ', display: 'i' },
				{ char: 'ـُ', display: 'u' }, { char: 'ـْ', display: '0' },
				{ char: 'ـّ', display: 'xx', wide: true },
				{ char: 'ـً', display: '-an', wide: true }, { char: 'ـٍ', display: '-in', wide: true },
				{ char: 'ـٌ', display: '-un', wide: true }
			]
		]
	},
	buckwalter: {
		name: 'Translit',
		display_script: 'latin',
		rows: [
			[
				{ char: 'ق', display: 'q' }, { char: 'و', display: 'w' },
				{ char: 'ع', display: 'E' }, { char: 'ر', display: 'r' },
				{ char: 'ت', display: 't' }, { char: 'ي', display: 'y' },
				{ char: 'ث', display: 'v' }, { char: 'ش', display: '$' },
				{ char: 'خ', display: 'x' }, { char: 'ح', display: 'H' },
				{ char: 'ء', display: "'" }
			],
			[
				{ char: 'ا', display: 'A' }, { char: 'س', display: 's' },
				{ char: 'د', display: 'd' }, { char: 'ف', display: 'f' },
				{ char: 'غ', display: 'g' }, { char: 'ه', display: 'h' },
				{ char: 'ج', display: 'j' }, { char: 'ك', display: 'k' },
				{ char: 'ل', display: 'l' }, { char: 'ص', display: 'S' },
				{ char: 'ض', display: 'D' }
			],
			[
				{ char: 'ز', display: 'z' }, { char: 'ب', display: 'b' },
				{ char: 'ن', display: 'n' }, { char: 'م', display: 'm' },
				{ char: 'ط', display: 'T' }, { char: 'ظ', display: 'Z' },
				{ char: 'ة', display: 'p' }, { char: 'ى', display: 'Y' },
				{ char: 'ئ', display: '}' }, { char: 'ؤ', display: '&' },
				{ char: 'آ', display: '|' }
			],
			[
				{ char: 'ـَ', display: 'a' }, { char: 'ـِ', display: 'i' },
				{ char: 'ـُ', display: 'u' }, { char: 'ـْ', display: 'o' },
				{ char: 'ـّ', display: '~' },
				{ char: 'ـً', display: 'F' }, { char: 'ـٍ', display: 'K' },
				{ char: 'ـٌ', display: 'N' }
			]
		]
	},
	academic: {
		name: 'Translit',
		display_script: 'latin',
		rows: [
			[
				{ char: 'ق', display: 'q' }, { char: 'و', display: 'w' },
				{ char: 'ع', display: "ʿ" }, { char: 'ر', display: 'r' },
				{ char: 'ت', display: 't' }, { char: 'ي', display: 'y' },
				{ char: 'ث', display: 'th', wide: true }, { char: 'ش', display: 'sh', wide: true },
				{ char: 'خ', display: 'kh', wide: true }, { char: 'ح', display: 'ḥ' },
				{ char: 'ء', display: 'ʾ' }
			],
			[
				{ char: 'ا', display: 'ā', wide: true }, { char: 'س', display: 's' },
				{ char: 'د', display: 'd' }, { char: 'ف', display: 'f' },
				{ char: 'غ', display: 'gh', wide: true }, { char: 'ه', display: 'h' },
				{ char: 'ج', display: 'j' }, { char: 'ك', display: 'k' },
				{ char: 'ل', display: 'l' }, { char: 'ص', display: 'ṣ' },
				{ char: 'ض', display: 'ḍ' }
			],
			[
				{ char: 'ز', display: 'z' }, { char: 'ب', display: 'b' },
				{ char: 'ن', display: 'n' }, { char: 'م', display: 'm' },
				{ char: 'ط', display: 'ṭ' }, { char: 'ظ', display: 'ẓ' },
				{ char: 'ة', display: 'a' }, { char: 'ى', display: 'ā', wide: true },
				{ char: 'ئ', display: 'ʾī', wide: true }, { char: 'ؤ', display: 'ʾū', wide: true },
				{ char: 'آ', display: 'ʾā', wide: true }
			],
			[
				{ char: 'ـَ', display: 'a' }, { char: 'ـِ', display: 'i' },
				{ char: 'ـُ', display: 'u' }, { char: 'ـْ', display: '∅' },
				{ char: 'ـّ', display: 'dup' },
				{ char: 'ـً', display: 'an' }, { char: 'ـٍ', display: 'in' },
				{ char: 'ـٌ', display: 'un' }
			]
		]
	}
};

// All built-in layouts in tab order. Extractable to a data file later.
const BUILTIN_LAYOUTS = [arabicLayout, phoneticLayout, transliterationLayouts.chat] as const;

// ─── Component logic ───────────────────────────────────────────────────────────

const props = withDefaults(defineProps<{
	layout?: KeyboardLayout;
	feedback?: { char: string; status: 'correct' | 'wrong' } | null;
	targetChar?: string | null;
}>(), {
	feedback: null,
	targetChar: null
});

// When a `layout` prop is supplied the caller controls the layout; tabs hide.
const selectedIdx = ref(0);
const transliterationMode = ref<TransliterationMode>('chat');
const showPicker = computed(() => !props.layout);
const isTranslitActive = computed(
	() => !props.layout && (BUILTIN_LAYOUTS[selectedIdx.value] ?? arabicLayout).name === 'Translit'
);
const activeLayout = computed(() => {
	if (props.layout) return props.layout;
	if (isTranslitActive.value) return transliterationLayouts[transliterationMode.value];
	return BUILTIN_LAYOUTS[selectedIdx.value] ?? arabicLayout;
});
const isLatinDisplay = computed(() => activeLayout.value.display_script === 'latin');

// Convention: last row of `rows` is always the diacritics strip.
const letterRows = computed(() => activeLayout.value.rows.slice(0, -1));
const diacriticsRow = computed(() => activeLayout.value.rows.at(-1) ?? []);

const emit = defineEmits<{
	(e: 'key', char: string): void;
	(e: 'prev'): void;
	(e: 'next'): void;
	(e: 'backspace'): void;
}>();

function onKey(k: Key) {
	emit('key', k.char);
}
</script>

<template>
	<div class="osk" :class="{ latin: isLatinDisplay }" :dir="isLatinDisplay ? 'ltr' : 'rtl'">

		<div v-if="diacriticsRow.length" class="osk_row diacritics">
			<button
				v-for="(k, ki) in diacriticsRow"
				:key="`d${ki}`"
				type="button"
				class="osk_key"
				:class="{
					wide: k.wide,
					correct: props.feedback && props.feedback.char === k.char && props.feedback.status === 'correct',
					wrong: props.feedback && props.feedback.char === k.char && props.feedback.status === 'wrong'
				}"
				@click="onKey(k)"
			>
				<span :class="{ ar: !isLatinDisplay }">{{ k.display ?? k.char }}</span>
			</button>
		</div>

		<div
			v-for="(row, ri) in letterRows"
			:key="`l${ri}`"
			class="osk_row letters"
			:style="isLatinDisplay ? undefined : { '--row_indent': `${ri * 0.6}rem` }"
		>
			<button
				v-for="(k, ki) in row"
				:key="ki"
				type="button"
				class="osk_key"
				:class="{
					wide: k.wide,
					correct: props.feedback && props.feedback.char === k.char && props.feedback.status === 'correct',
					wrong: props.feedback && props.feedback.char === k.char && props.feedback.status === 'wrong'
				}"
				@click="onKey(k)"
			>
				<span :class="{ ar: !isLatinDisplay }">{{ k.display ?? k.char }}</span>
			</button>
		</div>

		<div class="osk_row osk_controls">
			<button type="button" class="osk_key ctrl" @click="emit('prev')">
				<span>◀ skip</span>
			</button>
			<button type="button" class="osk_key ctrl" @click="emit('next')">
				<span>skip ▶</span>
			</button>
		</div>

		<div v-if="showPicker" class="osk_row osk_layout_switchers" dir="ltr">
			<button
				v-for="(layout, i) in BUILTIN_LAYOUTS"
				:key="layout.name"
				type="button"
				class="osk_tab"
				:class="{ active: selectedIdx === i }"
				@click="selectedIdx = i"
			>{{ layout.name }}</button>

			<template v-if="isTranslitActive">
				<button
					v-for="mode in transliterationModeOptions"
					:key="mode.id"
					type="button"
					class="osk_mode_btn"
					:class="{ active: transliterationMode === mode.id }"
					@click="transliterationMode = mode.id"
				>{{ mode.label }}</button>
			</template>
		</div>
	</div>
</template>

<style scoped>
.osk {
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 12px;
	background: var(--surface_bg);
	border: 1px solid var(--subtle_stroke);
	border-radius: var(--r_3);
	user-select: none;
	--key_size: clamp(28px, 6.6vw, 44px);
}

/* Latin display (phonetic / transliteration) — slightly wider keys, smaller font */
.osk.latin {
	--key_size: clamp(32px, 7.5vw, 48px);
}

.osk_row.osk_layout_switchers {
	margin-top: 6px;
	padding-top: 6px;
	border-top: 1px dashed var(--subtle_stroke);
	gap: 4px;
	direction: ltr;
	justify-content: flex-start;
}

.osk_mode_btn {
	padding: 2px 7px;
	background: transparent;
	border: 1px solid var(--strong_stroke);
	border-radius: var(--r_2);
	color: var(--tertiary_text);
	font-family: var(--f_ui);
	font-size: clamp(9px, 2vw, 11px);
	font-weight: 600;
	cursor: pointer;
	transition: background-color .12s, color .12s, border-color .12s;
}

.osk_mode_btn:hover {
	border-color: var(--secondary_text);
	color: var(--secondary_text);
}

.osk_mode_btn.active {
	background: transparent;
	border-color: #111;
	color: #111;
}

.osk_tab {
	padding: 3px 10px;
	background: transparent;
	border: 1px solid var(--subtle_stroke);
	border-radius: var(--r_2);
	color: var(--secondary_text);
	font-family: var(--f_ui);
	font-size: clamp(10px, 2.4vw, 12px);
	font-weight: 500;
	cursor: pointer;
	transition: background-color .12s, color .12s, border-color .12s;
}

.osk_tab:hover {
	background: var(--surface_bg);
	border-color: var(--primary_text);
	color: var(--primary_text);
}

.osk_tab.active {
	background: var(--primary_text);
	border-color: var(--primary_text);
	color: var(--page_bg);
}

.osk_row {
	display: flex;
	gap: 6px;
	justify-content: center;
}

.osk_row.letters {
	/* stagger like a physical keyboard; in RTL the indent visually shifts left */
	padding-inline-start: var(--row_indent, 0);
}

.osk_row.diacritics {
	margin-bottom: 8px;
	padding-bottom: 8px;
	border-bottom: 1px dashed var(--subtle_stroke);
}

.osk_row.osk_controls {
	margin-top: 8px;
	gap: 12px;
}

.osk_key {
	flex: 0 0 var(--key_size);
	min-width: 0;
	height: var(--key_size);
	padding: 0 4px;
	background: var(--page_bg);
	border: 1px solid var(--subtle_stroke);
	border-radius: var(--r_2);
	color: var(--primary_text);
	font-size: clamp(0.95rem, 3.4vw, 1.25rem);
	cursor: pointer;
	transition: background-color .12s, color .12s, border-color .12s, transform .08s;
}

.osk.latin .osk_key {
	font-family: var(--f_ui);
	font-size: clamp(0.65rem, 2.2vw, 0.85rem);
}

.osk_key.wide {
	flex-basis: var(--key_size);
}

.osk_key:hover {
	background: var(----olive_leaf_green);
	color: var(--inverse_text, #fff);
	border-color: transparent;
}

.osk_key:active { transform: translateY(1px); }

.osk_key.correct {
	background: var(----oasis_sage, #4f8a5c);
	color: #fff;
	border-color: transparent;
	animation: osk_pulse .35s ease-out;
}

.osk_key.wrong {
	background: var(----brick_red, #b34a3c);
	color: #fff;
	border-color: transparent;
	animation: osk_shake .3s ease-in-out;
}

.osk_controls .ctrl {
	flex: 1 1 auto;
	max-width: 10rem;
	font-family: var(--f_ui);
	font-size: clamp(11px, 2.6vw, 13px);
	font-weight: 500;
	color: var(--secondary_text);
}

@keyframes osk_pulse {
	0% { transform: scale(1); }
	50% { transform: scale(1.08); }
	100% { transform: scale(1); }
}

@keyframes osk_shake {
	0%, 100% { transform: translateX(0); }
	25% { transform: translateX(-4px); }
	75% { transform: translateX(4px); }
}
</style>
