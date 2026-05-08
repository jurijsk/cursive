<script setup lang="ts">
// Generic on-screen keyboard. Layout is data-driven so layouts can be swapped
// via prop or selected from the built-in set with the tab strip.
// `feedback` lets the parent flash a key green or red for quiz feedback.

interface Key {
	char: string;          // character emitted on press
	display?: string;      // optional override for rendering (e.g., diacritics on a tatweel)
	translit?: string;     // transliteration symbol for this mode (used for data attributes)
	wide?: boolean;        // takes 1.5× width (multi-char transliteration glyphs)
}

interface KeyboardLayout {
	name: string;
	// 'arabic'  → keys rendered with the Arabic font class
	// 'latin'   → keys rendered with UI font (transliteration)
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

type TransliterationMode = 'chat' | 'buckwalter' | 'academic';

const transliterationModeOptions: ReadonlyArray<{ id: TransliterationMode; label: string }> = [
	{ id: 'chat', label: 'Chat' },
	{ id: 'buckwalter', label: 'Buckwalter' },
	{ id: 'academic', label: 'Academic' }
];

// Translit variants share the same Arabic output; only key labels change.
// Rows follow the English keyboard shape (QWERTY / ASDF / ZXCVBNM).
// Extra transliteration-only symbols are kept in a dedicated top row.
const transliterationLayouts: Record<TransliterationMode, KeyboardLayout> = {
	chat: {
		name: 'Translit',
		display_script: 'latin',
		rows: [
			// qwerty row (10)
			[
				{ char: 'ق', display: 'q', translit: 'q' }, { char: 'و', display: 'w', translit: 'w' },
				{ char: 'ع', display: 'e', translit: '3' }, { char: 'ر', display: 'r', translit: 'r' },
				{ char: 'ت', display: 't', translit: 't' }, { char: 'ي', display: 'y', translit: 'y' },
				{ char: 'ث', display: 'u', translit: 'th' }, { char: 'ش', display: 'i', translit: 'sh' },
				{ char: 'خ', display: 'o', translit: 'kh' }, { char: 'ح', display: 'p', translit: '7' }
			],
			// asdf row (9)
			[
				{ char: 'ا', display: 'a', translit: 'a' }, { char: 'س', display: 's', translit: 's' },
				{ char: 'د', display: 'd', translit: 'd' }, { char: 'ف', display: 'f', translit: 'f' },
				{ char: 'غ', display: 'g', translit: 'gh' }, { char: 'ه', display: 'h', translit: 'h' },
				{ char: 'ج', display: 'j', translit: 'j' }, { char: 'ك', display: 'k', translit: 'k' }, { char: 'ل', display: 'l', translit: 'l' }
			],
			// zxcv row (7)
			[
				{ char: 'ز', display: 'z', translit: 'z' }, { char: 'خ', display: 'x', translit: 'x' },
				{ char: 'ث', display: 'c', translit: 'th' }, { char: 'ش', display: 'v', translit: 'sh' },
				{ char: 'ب', display: 'b', translit: 'b' }, { char: 'ن', display: 'n', translit: 'n' },
				{ char: 'م', display: 'm', translit: 'm' }
			],
			// extras strip (rendered on top)
			[
				{ char: 'ء', display: '2' }, { char: 'آ', display: '2a', wide: true },
				{ char: 'ئ', display: '2i', wide: true }, { char: 'ؤ', display: '2u', wide: true },
				{ char: 'ع', display: '3' }, { char: 'خ', display: '5' },
				{ char: 'ط', display: '6' }, { char: 'ح', display: '7' },
				{ char: 'ص', display: '9' }, { char: 'ظ', display: '6\'', wide: true }
			]
		]
	},
	buckwalter: {
		name: 'Translit',
		display_script: 'latin',
		rows: [
			// qwerty row (10)
			[
				{ char: 'ق', display: 'q' }, { char: 'و', display: 'w' },
				{ char: 'ع', display: 'e', translit: 'E' }, { char: 'ر', display: 'r' },
				{ char: 'ت', display: 't' }, { char: 'ي', display: 'y' },
				{ char: 'ـُ', display: 'u' }, { char: 'ـِ', display: 'i' },
				{ char: 'ـْ', display: 'o' }, { char: 'ة', display: 'p' }
			],
			// asdf row (9)
			[
				{ char: 'ا', display: 'a', translit: 'A' }, { char: 'س', display: 's' },
				{ char: 'د', display: 'd' }, { char: 'ف', display: 'f' },
				{ char: 'غ', display: 'g' }, { char: 'ه', display: 'h' },
				{ char: 'ج', display: 'j' }, { char: 'ك', display: 'k' }, { char: 'ل', display: 'l' }
			],
			// zxcv row (7)
			[
				{ char: 'ز', display: 'z' }, { char: 'خ', display: 'x' },
				{ char: 'ى', display: 'c', translit: 'Y' }, { char: 'ث', display: 'v' },
				{ char: 'ب', display: 'b' }, { char: 'ن', display: 'n' },
				{ char: 'م', display: 'm' }
			],
			// extras strip (rendered on top)
			[
				{ char: 'ء', display: '\'' }, { char: 'أ', display: '>' },
				{ char: 'إ', display: '<' }, { char: 'ئ', display: '}' },
				{ char: 'ؤ', display: '&' }, { char: 'آ', display: '|' },
				{ char: 'ش', display: '$' }, { char: 'ذ', display: '*' },
				{ char: 'ح', display: 'H' }, { char: 'ص', display: 'S' },
				{ char: 'ض', display: 'D' }, { char: 'ط', display: 'T' },
				{ char: 'ظ', display: 'Z' }
			]
		]
	},
	academic: {
		name: 'Translit',
		display_script: 'latin',
		rows: [
			// qwerty row (10)
			[
				{ char: 'ق', display: 'q', translit: 'q' }, { char: 'و', display: 'w', translit: 'w' },
				{ char: 'ع', display: 'e', translit: 'ʿ' }, { char: 'ر', display: 'r', translit: 'r' },
				{ char: 'ت', display: 't', translit: 't' }, { char: 'ي', display: 'y', translit: 'y' },
				{ char: 'ث', display: 'u', translit: 'ṯ' }, { char: 'ش', display: 'i', translit: 'š' },
				{ char: 'خ', display: 'o', translit: 'ḵ' }, { char: 'ح', display: 'p', translit: 'ḥ' }
			],
			// asdf row (9)
			[
				{ char: 'ا', display: 'a', translit: 'ā' }, { char: 'س', display: 's', translit: 's' },
				{ char: 'د', display: 'd', translit: 'd' }, { char: 'ف', display: 'f', translit: 'f' },
				{ char: 'غ', display: 'g', translit: 'ġ' }, { char: 'ه', display: 'h', translit: 'h' },
				{ char: 'ج', display: 'j', translit: 'ǧ' }, { char: 'ك', display: 'k', translit: 'k' }, { char: 'ل', display: 'l', translit: 'l' }
			],
			// zxcv row (7)
			[
				{ char: 'ز', display: 'z', translit: 'z' }, { char: 'خ', display: 'x', translit: 'ḵ' },
				{ char: 'ث', display: 'c', translit: 'ṯ' }, { char: 'ش', display: 'v', translit: 'š' },
				{ char: 'ب', display: 'b', translit: 'b' }, { char: 'ن', display: 'n', translit: 'n' },
				{ char: 'م', display: 'm', translit: 'm' }
			],
			// extras strip (rendered on top)
			[
				{ char: 'ء', display: 'ʾ' }, { char: 'ع', display: 'ʿ' },
				{ char: 'ح', display: 'ḥ' }, { char: 'ص', display: 'ṣ' },
				{ char: 'ض', display: 'ḍ' }, { char: 'ط', display: 'ṭ' },
				{ char: 'ظ', display: 'ẓ' }, { char: 'ا', display: 'ā' },
				{ char: 'ي', display: 'ī' }, { char: 'و', display: 'ū' },
				{ char: 'ئ', display: 'ʾī', wide: true }, { char: 'ؤ', display: 'ʾū', wide: true },
				{ char: 'آ', display: 'ʾā', wide: true }
			]
		]
	}
};

// All built-in layouts in tab order. Extractable to a data file later.
const BUILTIN_LAYOUTS = [arabicLayout, transliterationLayouts.chat] as const;

// ─── Component logic ───────────────────────────────────────────────────────────

const props = withDefaults(defineProps<{
	layout?: KeyboardLayout;
	feedback?: { char: string; status: 'correct' | 'wrong' } | null;
	targetChar?: string | null;
}>(), {
	layout: undefined,
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
const rowIndentStyle = (row_idx: number) => {
	if (isLatinDisplay.value) {
		const latin_row_indents = ['0rem', '0.9rem', '1.6rem'];
		return { '--row_indent': latin_row_indents[row_idx] ?? '0rem' };
	}
	return { '--row_indent': `${row_idx * 0.6}rem` };
};

// Convention: last row of `rows` is always the diacritics strip.
const letterRows = computed(() => activeLayout.value.rows.slice(0, -1));
const diacriticsRow = computed(() => activeLayout.value.rows.at(-1) ?? []);

const emit = defineEmits<{
	(e: 'key', char: string): void;
	(e: 'left' | 'right' | 'backspace'): void;
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
				:data-arabic="k.char"
				:data-translit="k.translit ?? k.display ?? k.char"
				@click="onKey(k)"
			>
				<span :class="{ ar: !isLatinDisplay }">{{ k.display ?? k.char }}</span>
			</button>
		</div>

		<div
			v-for="(row, ri) in letterRows"
			:key="`l${ri}`"
			class="osk_row letters"
			:style="rowIndentStyle(ri)"
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
				:data-arabic="k.char"
				:data-translit="k.translit ?? k.display ?? k.char"
				@click="onKey(k)"
			>
				<span :class="{ ar: !isLatinDisplay }">{{ k.display ?? k.char }}</span>
			</button>
		</div>

		<div class="osk_row osk_controls">
			<button type="button" class="osk_key ctrl" aria-label="Go left" @click="emit('left')">
				<span>◀</span>
			</button>
			<button type="button" class="osk_key ctrl" aria-label="Go right" @click="emit('right')">
				<span>▶</span>
			</button>
		</div>

		<div v-if="showPicker" class="osk_row osk_layout_switchers" dir="ltr">
			<button
				v-for="(layout_option, i) in BUILTIN_LAYOUTS"
				:key="layout_option.name"
				type="button"
				class="osk_tab"
				:class="{ active: selectedIdx === i }"
				@click="selectedIdx = i"
			>{{ layout_option.name }}</button>

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

/* Latin display (transliteration) — slightly wider keys, smaller font */
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
	border-color: var(--accent_primary_hi);
	color: var(--accent_primary_hi);
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
	background: var(--inverse_surface_bg);
	border-color: var(--inverse_surface_bg);
	color: var(--inverse_text);
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
	direction: ltr;
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
	background: var(--success_color);
	color: var(--on_primary_text);
	border-color: transparent;
}

.osk_key:active { transform: translateY(1px); }

.osk_key.correct {
	background: var(--accent_primary);
	color: var(--on_primary_text);
	border-color: transparent;
	animation: osk_pulse .35s ease-out;
}

.osk_key.wrong {
	background: var(--error_color);
	color: var(--on_primary_text);
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
