<script lang="ts">
	import { pergiKe } from '$lib/nav';
	import { auth } from '$lib/stores/auth.svelte';

	let { children } = $props();

	$effect(() => {
		if (!auth.siap) return;
		if (auth.terautentikasi) {
			void pergiKe(auth.dashboardPath());
		}
	});
</script>

{@render children()}
