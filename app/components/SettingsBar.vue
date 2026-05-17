<script setup lang="ts">
import type { FontKey } from '~/stores/settings';
import type { Dialect } from '~/data/letters';

interface FontOption {
	key: FontKey;
	label: string;
	family: string;
}

defineProps<{
	fontOptions: FontOption[];
	font: FontKey;
	dialect: Dialect;
	previewText: string;
}>();

defineEmits<{
	'update:font': [font: FontKey];
	'update:dialect': [dialect: Dialect];
}>();
</script>

<template>
	<div class="settings_bar">
		<section class="font_picker_section">
			<div class="label-eyebrow">Font</div>
			<div class="font_picker">
				<button
					v-for="f in fontOptions"
					:key="f.key"
					type="button"
					class="font_btn"
					:class="{ active: font === f.key }"
					@click="$emit('update:font', f.key)"
				>
					<span class="font_btn_sample ar" :style="{ fontFamily: f.family }">{{ previewText }}</span>
					<span class="font_btn_label">{{ f.label }}</span>
				</button>
			</div>
		</section>
		<div class="dialect_picker">
			<button type="button" class="dialect_btn" :class="{ active: dialect === 'palestinian' }" @click="$emit('update:dialect', 'palestinian')">Palestinian</button>
			<button type="button" class="dialect_btn" :class="{ active: dialect === 'lebanese' }" @click="$emit('update:dialect', 'lebanese')">Lebanese</button>
		</div>
	</div>
</template>

<style scoped>
.settings_bar {
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: flex-start;
	gap: 16px;
}

@container page (max-width: 38rem) {
	.settings_bar {
		flex-direction: column;

		.dialect_picker {
			order: -1;
		}
	}
}

@supports not (container-type: inline-size) {
	@media (max-width: 640px) {
		.settings_bar {
			flex-direction: column;

			.dialect_picker {
				order: -1;
			}
		}
	}
}

.font_picker_section {
	display: flex;
	flex-direction: column;
	gap: 10px;
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

	&:hover {
		background: var(--quiet_button_bg);
		border-color: var(--quiet_button_border);
	}

	&.active {
		background: var(--inverse_surface_bg);
		border-color: var(--inverse_surface_bg);
		color: var(--inverse_text);
	}
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

	&.active {
		background: var(--accent_primary);
		color: var(--on_primary_text);
	}
}
</style>
