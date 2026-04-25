// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
	[{
		ignores: ['app/pages/import.vue'],
		rules: {
			'semi': ['error', 'always'],
			'indent': ['error', 'tab'],
			'quotes': ['error', 'single'],
			'comma-dangle': ['error', 'never'],
			'no-debugger': 'off',
			'vue/no-multiple-template-root': 'warn',
			'vue/require-v-for-key': 'warn'
		}
	}
	]
);


