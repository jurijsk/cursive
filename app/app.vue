<template>
	<div class="app">
		<header class="app_bar">
			<NuxtLink to="/" class="brand" aria-label="Cursive home">
				<img src="/favicon.png" alt="" class="brand_mark" >
			</NuxtLink>
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
		position: relative;
	}

	.app_bar {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: 16px;
		padding: 16px clamp(16px, 4vw, 36px);
		border-bottom: none;
		background: transparent;
		position: absolute;
		inset-block-start: 0;
		inset-inline-start: 0;
		z-index: 2;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 0;
		color: inherit;
		text-decoration: none;

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

	.page {
		flex: 1;
		width: 100%;
		max-width: 960px;
		margin: 0 auto;
		padding: clamp(20px, 4vw, 40px);
		padding-top: calc(clamp(20px, 4vw, 40px) + 52px);
		container-type: inline-size;
		container-name: page;
	}

	@media (max-width: 560px) {
		.app_bar {
			padding: 12px 16px;
			gap: 10px;
		}
		.brand_mark { width: 32px; height: 32px; }
		.page {
			padding: 16px;
			padding-top: 60px;
		}
	}
</style>
