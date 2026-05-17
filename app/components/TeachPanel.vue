<script setup lang="ts">
import type { LetterInfo, Dialect } from '~/data/letters';

defineProps<{
	selectedLetter: LetterInfo | null;
	hasSelection: boolean;
	hasPrev: boolean;
	hasNext: boolean;
	prevPreview: string;
	nextPreview: string;
	dialect: Dialect;
}>();

defineEmits<{
	prev: [];
	next: [];
	back: [];
}>();
</script>

<template>
	<div class="panel_top_row">
		<div v-if="selectedLetter" class="letter_row">
			<span class="hero_letter ar">{{ selectedLetter.kind === 'diacritic' ? 'ـ' + selectedLetter.char : selectedLetter.char }}</span>
			<div class="letter_info">
				<div class="letter_name">{{ selectedLetter.name }}</div>
				<div class="letter_translit"><span class="label-eyebrow">Transliteration</span> {{ (selectedLetter.transliterationByDialect?.[dialect] ?? selectedLetter.transliteration).join(', ') }}</div>
			</div>
		</div>
		<div class="panel_nav">
			<button type="button" class="nav_btn" :disabled="!hasPrev" @click="$emit('prev')">
				<span class="nav_arrow">←</span>
				<span class="nav_preview">{{ prevPreview }}</span>
			</button>
			<button type="button" class="nav_btn" :disabled="!hasNext" @click="$emit('next')">
				<span class="nav_preview">{{ nextPreview }}</span>
				<span class="nav_arrow">→</span>
			</button>
		</div>
	</div>
	<template v-if="selectedLetter">
		<div v-if="selectedLetter.kind === 'letter' || selectedLetter.kind === 'diacritic'" class="forms_row">
			<template v-if="selectedLetter.kind === 'letter'">
				<div class="form_cell">
					<div class="form_label">isolated</div>
					<div class="form_glyph ar">{{ selectedLetter.char }}</div>
				</div>
				<div class="form_cell">
					<div class="form_label">initial</div>
					<div class="form_glyph ar">{{ selectedLetter.char }}<span class="form_tatweel">ـ</span></div>
				</div>
				<div class="form_cell">
					<div class="form_label">medial</div>
					<div class="form_glyph ar"><span class="form_tatweel">ـ</span>{{ selectedLetter.char }}<span class="form_tatweel">ـ</span></div>
				</div>
				<div class="form_cell">
					<div class="form_label">final</div>
					<div class="form_glyph ar"><span class="form_tatweel">ـ</span>{{ selectedLetter.char }}</div>
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
			</div>
			<div class="pron_ipa">{{ selectedLetter.pronunciation[dialect].ipa }}</div>
			<div class="pron_desc">{{ selectedLetter.pronunciation[dialect].description }}</div>
			<div v-if="selectedLetter.pronunciation[dialect].englishExamples.length" class="pron_examples">
				<span class="label-eyebrow">English examples</span>
				<span>{{ selectedLetter.pronunciation[dialect].englishExamples.join(', ') }}</span>
			</div>
		</div>
	</template>
	<div v-else-if="hasSelection" class="no_letter">No letter information available for this glyph.</div>
	<div v-else class="info_hint">Click any letter above to see its name, sound, and contextual forms.</div>
	<button type="button" class="mode_back_link" @click="$emit('back')">← Change mode</button>
</template>

<style scoped>
.panel_top_row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	min-width: 0;
}

@container page (max-width: 30rem) {
	.panel_top_row {
		flex-direction: column-reverse;
		align-items: flex-start;

		.panel_nav {
			align-self: flex-end;
		}
	}
}

@supports not (container-type: inline-size) {
	@media (max-width: 540px) {
		.panel_top_row {
			flex-direction: column-reverse;
			align-items: flex-start;

			.panel_nav {
				align-self: flex-end;
			}
		}
	}
}

.panel_nav {
	display: flex;
	justify-content: flex-end;
	margin-inline-start: auto;
	flex-shrink: 0;
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

	&:hover:not(:disabled) {
		background: var(--quiet_button_bg);
		border-color: var(--quiet_button_border);
	}

	&:disabled {
		opacity: 0.35;
		cursor: default;
	}
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
	flex: 1;
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

.form_tatweel {
	color: var(--muted_text);
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

	.label-eyebrow {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 0;
	}
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

.mode_back_link {
	align-self: flex-start;
	background: none;
	border: none;
	color: var(--tertiary_text);
	font-size: 12px;
	font-family: var(--f_ui);
	cursor: pointer;
	padding: 0;

	&:hover {
		color: var(--secondary_text);
	}
}

@media (max-width: 640px) {
	.letter_row {
		gap: 12px;
	}

	.hero_letter {
		font-size: 3rem;
		flex-shrink: 0;
	}

	.pron_header {
		flex-wrap: nowrap;
		gap: 8px;
	}

	.form_glyph {
		font-size: clamp(1.2rem, 5.5vw, 1.6rem);
	}
}

@media (max-width: 420px) {
	.hero_letter {
		font-size: 2.5rem;
	}

	.letter_name {
		font-size: 1.1rem;
	}

	.nav_btn {
		padding: 6px 10px;
	}

	.nav_preview {
		font-size: 1.3rem;
	}
}
</style>
