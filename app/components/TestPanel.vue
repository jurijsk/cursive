<script setup lang="ts">
interface TestOption {
	char: string;
	ipa: string;
	testDescription: string;
	isCorrect: boolean;
}

defineProps<{
	testIndex: number;
	testQueueLength: number;
	testOptions: TestOption[];
	testFeedback: { char: string; status: 'correct' | 'wrong' } | null;
}>();

defineEmits<{
	prev: [];
	next: [];
	done: [];
	answer: [opt: TestOption];
}>();
</script>

<template>
	<div class="test_header">
		<span class="test_progress">{{ testIndex + 1 }} / {{ testQueueLength }}</span>
		<div class="panel_nav">
			<button type="button" class="nav_btn" :disabled="testIndex === 0" @click="$emit('prev')">
				<span class="nav_arrow">←</span>
			</button>
			<button type="button" class="nav_btn" :disabled="testIndex >= testQueueLength - 1" @click="$emit('next')">
				<span class="nav_arrow">→</span>
			</button>
		</div>
		<button type="button" class="done_btn" @click="$emit('done')">Done</button>
	</div>
	<p class="test_prompt">Which pronunciation matches the highlighted letter?</p>
	<div class="test_options">
		<button
			v-for="opt in testOptions"
			:key="opt.char"
			type="button"
			class="test_option"
			:class="{
				correct: testFeedback?.char === opt.char && testFeedback.status === 'correct',
				wrong: testFeedback?.char === opt.char && testFeedback.status === 'wrong'
			}"
			@click="$emit('answer', opt)"
		>
			<span class="opt_ipa">{{ opt.ipa }}</span>
			<span class="opt_desc">{{ opt.testDescription }}</span>
		</button>
	</div>
</template>

<style scoped>
.test_header {
	display: flex;
	align-items: center;
	gap: 12px;
}

.test_progress {
	flex: 1;
	font-family: var(--f_mono);
	font-size: 13px;
	color: var(--secondary_text);
}

.panel_nav {
	display: flex;
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

.done_btn {
	height: 30px;
	padding: 0 12px;
	font-family: var(--f_ui);
	font-size: 12px;
	font-weight: 500;
	border-radius: var(--r_button);
	cursor: pointer;
	background: var(--quiet_button_bg);
	color: var(--quiet_button_text);
	border: 1px solid var(--quiet_button_border);
	transition: background-color .15s;

	&:hover {
		background: var(--hover_quiet_button_bg);
	}
}

.test_prompt {
	margin: 0;
	font-size: 13px;
	color: var(--secondary_text);
}

.test_options {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px;
}

.test_option {
	display: flex;
	flex-direction: row;
	align-items: baseline;
	gap: 6px;
	padding: 10px 12px;
	background: var(--page_bg);
	border: 1px solid var(--subtle_stroke);
	border-radius: var(--r_3);
	cursor: pointer;
	text-align: start;
	transition: background-color .12s, border-color .12s;
	font-family: var(--f_ui);

	&:hover:not(.correct):not(.wrong) {
		background: var(--quiet_button_bg);
		border-color: var(--quiet_button_border);
	}

	&.correct {
		background: var(--accent_primary);
		border-color: var(--accent_primary);
		color: var(--on_primary_text);
		animation: test_pulse .4s ease-out;
	}

	&.wrong {
		background: var(--error_quiet_bg);
		border-color: var(--error_color);
		animation: test_shake .3s ease-in-out;
	}
}

.opt_ipa {
	font-family: var(--f_mono);
	font-size: 1rem;
	font-weight: 600;
}

.opt_desc {
	flex: 1;
	font-size: 12px;
	opacity: 0.8;
	line-height: 1.4;
	color: inherit;
}

@keyframes test_pulse {
	0% { transform: scale(1); }
	50% { transform: scale(1.03); }
	100% { transform: scale(1); }
}

@keyframes test_shake {
	0%, 100% { transform: translateX(0); }
	25% { transform: translateX(-4px); }
	75% { transform: translateX(4px); }
}

@media (max-width: 640px) {
	.test_options {
		grid-template-columns: 1fr;
	}
}
</style>
