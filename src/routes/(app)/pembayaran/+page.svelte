<script lang="ts">
	import { onMount } from 'svelte';
	import { pergiKe } from '$lib/nav';

	onMount(() => {
		void pergiKe('/piutang', { replaceState: true });
	});
</script>

<p class="text-sm text-muted">Mengalihkan ke piutang…</p>
