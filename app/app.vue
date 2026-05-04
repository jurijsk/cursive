<template>
	<div class="app">
		<header class="app_bar">
			<NuxtLink to="/" class="brand" aria-label="Cursive home">
				<img src="/favicon.png" alt="" class="brand_mark" >
				<div class="brand_name">Cursive</div>
			</NuxtLink>
			<div class="brand_subtitle label-eyebrow">Arabic script, shaped</div>
		</header>
		<main class="page">
			<NuxtPage />
		</main>
	</div>
</template>

<style>
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--page_bg);
	}

	.app_bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 16px clamp(16px, 4vw, 36px);
		border-bottom: 1px solid var(--subtle_stroke);
		background: var(--surface_bg);
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 12px;
		color: inherit;
		text-decoration: none;

		&:hover .brand_name {
			color: var(--accent_primary);
		}

		&:focus-visible {
			outline: 2px solid var(--focus_field_border);
			outline-offset: 4px;
			border-radius: var(--r_2);
		}
	}

	.brand_mark {
		width: 36px;
		height: 36px;
		border-radius: var(--r_2);
		display: block;
		object-fit: contain;
	}

	.brand_name {
		font-family: var(--f_display);
		font-size: 20px;
		font-weight: 500;
		letter-spacing: -0.01em;
	}

	.page {
		flex: 1;
		width: 100%;
		max-width: 960px;
		margin: 0 auto;
		padding: clamp(20px, 4vw, 40px);
	}

	@media (max-width: 560px) {
		.app_bar {
			padding: 12px 16px;
			gap: 10px;
		}
		.brand_subtitle { display: none; }
		.brand_name { font-size: 18px; }
		.brand_mark { width: 32px; height: 32px; }
		.page { padding: 16px; }
	}
</style>
