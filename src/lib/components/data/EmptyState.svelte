<script lang="ts">
	interface Props {
		title?: string;
		description?: string;
		message?: string;
	}

	let { title = 'Tidak ada data', description = '', message }: Props = $props();

	const judul = $derived(message ?? title);
</script>

<div class="flex flex-col items-center gap-2 px-6 py-16 text-center">
	<div class="bg-primary/10 text-primary mb-1 flex size-12 items-center justify-center rounded-full text-lg font-bold">
		∅
	</div>
	<p class="text-foreground text-sm font-semibold">{judul}</p>
	{#if description}
		<p class="text-muted-foreground max-w-sm text-sm leading-relaxed">{description}</p>
	{/if}
</div>
