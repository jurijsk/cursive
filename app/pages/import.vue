<script setup lang="ts">
	import initHarfBuzz from 'harfbuzzjs/hb';
	import createharfBuzzWrap from 'harfbuzzjs/hbjs';



	const hbRaw = await initHarfBuzz();
	const harfBuzz = createharfBuzzWrap(hbRaw);

	

</script>