<script setup lang="ts">

const route = useRoute();
const text = computed(() => (route.params.text ?? '') as string);
</script>
<template>
	<span class="font-family-tajawal">{{ text }}</span>
</template>
<style>
.font-family-tajawal {
	font-family: "Tajawal Regular";
}
</style>