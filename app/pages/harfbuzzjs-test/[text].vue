<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const param = (route.params.text as string) ?? '';
const input = ref(param || 'مرحبا');
const shaped = ref<Array<any>>([]);
const error = ref<string | null>(null);

async function runHarfBuzz(text: string) {
	shaped.value = [];
	error.value = null;
	try {
		const harf = await import('harfbuzzjs');
		const hbFactory = (harf && (harf.default || harf));
		const hb = await hbFactory();

		const fontBuf = await fetch('/fonts/Tajawal-Regular.ttf').then((r) => r.arrayBuffer());

		const face = hb.Face(fontBuf);
		const font = hb.Font(face);
		const buf = hb.createBuffer();
		const normalized = (text ?? '').normalize('NFC');
		buf.addText(normalized);
		buf.guessSegmentProperties();
		hb.shape(font, buf);

		const infos = buf.getGlyphInfos();
		const positions = buf.getGlyphPositions();

		const out: any[] = [];
		for(let i = 0;i < infos.length;i++) {
			out.push({
				index: infos[i].codepoint ?? infos[i].gid ?? infos[i].glyph ?? infos[i].glyph_id ?? infos[i].index ?? infos[i],
				cluster: infos[i].cluster,
				x_advance: positions[i]?.x_advance ?? positions[i]?.xAdvance ?? positions[i]?.x ?? 0,
				x_offset: positions[i]?.x_offset ?? positions[i]?.xOffset ?? positions[i]?.xOff ?? 0,
				y_advance: positions[i]?.y_advance ?? positions[i]?.yAdvance ?? positions[i]?.y ?? 0,
				y_offset: positions[i]?.y_offset ?? positions[i]?.yOffset ?? positions[i]?.yOff ?? 0,
			});
		}

		shaped.value = out;
	} catch(e: any) {
		console.error('harfbuzz error', e);
		error.value = e?.message || String(e);
	}
}

onMounted(() => {
	runHarfBuzz(input.value);
});

watch(input, (v) => runHarfBuzz(v));
</script>
<template>
	<div class="harfbuzz-test">
		<label>Text to shape (path param used):</label>
		<input v-model="input" />
		<div v-if="error">Error: {{ error }}</div>
		<div v-else>
			<h3>Shaped glyph info (harfbuzzjs only)</h3>
			<table>
				<thead>
					<tr>
						<th>#</th>
						<th>glyph index</th>
						<th>cluster</th>
						<th>x_advance</th>
						<th>x_offset</th>
						<th>y_advance</th>
						<th>y_offset</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(g, i) in shaped" :key="i">
						<td>{{ i + 1 }}</td>
						<td>{{ g.index }}</td>
						<td>{{ g.cluster }}</td>
						<td>{{ g.x_advance }}</td>
						<td>{{ g.x_offset }}</td>
						<td>{{ g.y_advance }}</td>
						<td>{{ g.y_offset }}</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>
<style scoped>
.harfbuzz-test {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

input {
	padding: 0.4rem
}

table {
	border-collapse: collapse;
	width: 100%
}

th, td {
	border: 1px solid #ddd;
	padding: 0.3rem;
	text-align: left
}
</style>
