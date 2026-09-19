<script lang="ts">
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

<div class="flex flex-col gap-3 text-sm text-muted sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
	<p>
		{#if total === 0}
			Tidak ada data
		{:else}
			Menampilkan {dari} sampai {sampai} dari {total}
		{/if}
	</p>
	<div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:flex sm:items-center">
		<button
			type="button"
			class="min-h-11 rounded-md border border-slate-200 bg-white px-3 py-2 disabled:opacity-40 sm:min-h-0 sm:px-2.5 sm:py-1.5"
			disabled={page <= 1}
			onclick={() => onpage?.(page - 1)}
		>
			Sebelumnya
		</button>
		<span class="text-center tabular-nums text-ink">{page} / {Math.max(totalPages, 1)}</span>
		<button
			type="button"
			class="min-h-11 rounded-md border border-slate-200 bg-white px-3 py-2 disabled:opacity-40 sm:min-h-0 sm:px-2.5 sm:py-1.5"
			disabled={page >= totalPages}
			onclick={() => onpage?.(page + 1)}
		>
			Berikutnya
		</button>
	</div>
</div>
