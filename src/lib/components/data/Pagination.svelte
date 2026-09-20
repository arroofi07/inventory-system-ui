<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

	interface Props {
		page?: number;
		perPage?: number;
		total?: number;
		totalPages?: number;
		onpage?: (page: number) => void;
	}

	let {
		page = 1,
		perPage = 20,
		total = 0,
		totalPages = 1,
		onpage
	}: Props = $props();

	const dari = $derived(total === 0 ? 0 : (page - 1) * perPage + 1);
	const sampai = $derived(Math.min(page * perPage, total));
</script>

<Card.Root
	class="border-border/80 mt-1 flex flex-col gap-3 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
	size="sm"
>
	<p class="text-muted-foreground text-sm">
		{#if total === 0}
			Tidak ada data
		{:else}
			Menampilkan <span class="text-foreground font-medium tabular-nums">{dari}</span>
			–
			<span class="text-foreground font-medium tabular-nums">{sampai}</span>
			dari
			<span class="text-foreground font-medium tabular-nums">{total}</span>
		{/if}
	</p>
	<div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:flex sm:items-center">
		<Button
			type="button"
			variant="outline"
			size="sm"
			class="min-h-11 sm:min-h-8"
			disabled={page <= 1}
			onclick={() => onpage?.(page - 1)}
		>
			Sebelumnya
		</Button>
		<span
			class="bg-primary/10 text-primary rounded-full px-3 py-1 text-center text-xs font-semibold tabular-nums"
		>
			{page} / {Math.max(totalPages, 1)}
		</span>
		<Button
			type="button"
			variant="outline"
			size="sm"
			class="min-h-11 sm:min-h-8"
			disabled={page >= totalPages}
			onclick={() => onpage?.(page + 1)}
		>
			Berikutnya
		</Button>
	</div>
</Card.Root>
