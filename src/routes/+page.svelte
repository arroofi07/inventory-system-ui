<script lang="ts">
	import { onMount } from 'svelte';
	import { pergiKe } from '$lib/nav';
	import { auth } from '$lib/stores/auth.svelte';

	onMount(async () => {
		if (!auth.siap) {
			await auth.pulihkanSesi();
		}
		await pergiKe(auth.terautentikasi ? auth.dashboardPath() : '/login');
	});
</script>

<p class="p-6 text-sm text-[var(--color-muted)]">Mengalihkan…</p>
