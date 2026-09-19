<script lang="ts">
	interface Props {
		title?: string;
		description?: string;
		message?: string;
	}

	let {
		title = 'Tidak ada data',
		description = '',
		message
	}: Props = $props();

	const judul = $derived(message ?? title);
</script>

<div class="flex flex-col items-center gap-1 px-4 py-12 text-center">
	<p class="text-sm font-medium text-ink">{judul}</p>
	{#if description}
		<p class="max-w-sm text-sm text-muted">{description}</p>
	{/if}
</div>
