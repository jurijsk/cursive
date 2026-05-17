<script setup lang="ts">
import commonWords from '~/data/common_words.json';

const PINNED_COMMON_WORDS_COUNT = 5;

const modelValue = defineModel<string>({ required: true });

interface CommonWordEntry {
	text: string;
	transliteration: string;
	translation: string;
}

const commonWordList = (commonWords as CommonWordEntry[])
	.map((entry) => ({
		text: entry.text.trim(),
		transliteration: entry.transliteration.trim(),
		translation: entry.translation.trim()
	}))
	.filter(entry => entry.text.length > 0 && entry.translation.length > 0);

const currentCommonWord = computed(() => {
	const normalized = modelValue.value.trim();
	if(!normalized) return null;
	return commonWordList.find(entry => entry.text === normalized) ?? null;
});

const translationRevealed = ref(false);
const transliterationRevealed = ref(false);

watch(modelValue, () => {
	translationRevealed.value = false;
	transliterationRevealed.value = false;
});

function pickRandomCommonWord() {
	const randomPool = commonWordList.slice(PINNED_COMMON_WORDS_COUNT);
	if(randomPool.length === 0) return;
	if(randomPool.length === 1) {
		modelValue.value = randomPool[0]!.text;
		return;
	}
	let nextEntry = randomPool[Math.floor(Math.random() * randomPool.length)]!;
	let attempts = 0;
	while(nextEntry.text === modelValue.value && attempts < 10) {
		nextEntry = randomPool[Math.floor(Math.random() * randomPool.length)]!;
		attempts++;
	}
	modelValue.value = nextEntry.text;
}
</script>

<template>
	<div class="field">
		<div class="field_top_row">
			<div class="examples examples_inline">
				<button v-for="ex in commonWordList.slice(0, PINNED_COMMON_WORDS_COUNT)" :key="ex.text" type="button" class="example_chip" @click="modelValue = ex.text">
					<span class="ex_text ar">{{ ex.text }}</span>
				</button>
				<button type="button" class="example_chip example_chip_random" :disabled="!commonWordList.length" aria-label="random common word" @click="pickRandomCommonWord">
					<img src="/ghost.svg" alt="" class="ghost_icon" aria-hidden="true">
				</button>
			</div>
			<input id="shape_input" v-model="modelValue" class="text_input ar" dir="rtl">
		</div>
		<div v-if="currentCommonWord" class="field_translation">
			<span class="show_label">show:</span>
			<button type="button" class="translation_toggle_btn" @click="transliterationRevealed = !transliterationRevealed">
				<span v-if="!transliterationRevealed">transliteration</span>
				<span v-else class="revealed_text">{{ currentCommonWord.transliteration }}</span>
			</button>
			<button type="button" class="translation_toggle_btn" @click="translationRevealed = !translationRevealed">
				<span v-if="!translationRevealed">translation</span>
				<span v-else class="revealed_text">{{ currentCommonWord.translation }}</span>
			</button>
		</div>
	</div>
</template>

<style scoped>
.field {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.field_top_row {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8px;
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
	flex: 1 1 20rem;
	min-width: 16rem;

	&:focus {
		border-color: var(--focus_field_border);
		box-shadow: 0 0 0 3px var(--focus_field_ring);
	}
}

.field_translation {
	font-family: var(--f_mono);
	font-size: 12px;
	color: var(--secondary_text);
	padding-inline: 4px;
	text-align: end;
	display: flex;
	gap: 8px;
	justify-content: flex-end;
	align-items: baseline;

	.show_label {
		color: var(--tertiary_text);
	}
}

.translation_toggle_btn {
	font: inherit;
	color: var(--accent_primary_hi);
	background: transparent;
	border: 0;
	padding: 0;
	cursor: pointer;
	text-decoration: underline;

	&:hover {
		color: var(--accent_primary);
	}
}

.examples {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.examples_inline {
	flex: 0 1 auto;
	flex-wrap: nowrap;
	max-width: 100%;

	.example_chip {
		flex: 0 0 auto;
	}
}

@container page (max-width: 52rem) {
	.field_top_row {
		.examples_inline,
		.text_input {
			flex: 1 1 100%;
		}

		.examples_inline .example_chip {
			flex: 1 1 0;
			min-width: 0;
		}
	}
}

@supports not (container-type: inline-size) {
	@media (max-width: 900px) {
		.field_top_row {
			.examples_inline,
			.text_input {
				flex: 1 1 100%;
			}

			.examples_inline .example_chip {
				flex: 1 1 0;
				min-width: 0;
			}
		}
	}
}

.example_chip {
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 2px;
	height: 56px;
	padding: 0 14px;
	background: var(--surface_bg);
	border: 1px solid var(--subtle_stroke);
	border-radius: var(--r_3);
	color: var(--primary_text);
	cursor: pointer;
	transition: background-color .15s, border-color .15s;

	&:hover {
		background: var(--quiet_button_bg);
		border-color: var(--quiet_button_border);
	}

	&:disabled {
		opacity: .5;
		cursor: default;
	}
}

.example_chip_random {
	justify-content: center;
	min-width: 3.25rem;
	padding-inline: 10px;
}

.ghost_icon {
	width: 1.35rem;
	height: 1.35rem;
	object-fit: contain;
}

.ex_text {
	font-size: 1.35rem;
	color: var(--primary_text);
	direction: rtl;
}

@media (max-width: 640px) {
	.text_input {
		height: 48px;
		font-size: 18px;
		padding: 0 12px;
		min-width: 0;
	}

	.example_chip {
		height: 48px;

		.ex_text {
			font-size: clamp(1rem, 3.9vw, 1.15rem);
		}
	}
}
</style>
