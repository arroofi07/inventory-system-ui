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

<div class="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
	<p>
		{#if total === 0}
			Tidak ada data
		{:else}
			Menampilkan {dari} sampai {sampai} dari {total}
		{/if}
	</p>
	<div class="flex items-center gap-2">
		<button
			type="button"
			class="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 disabled:opacity-40"
			disabled={page <= 1}
			onclick={() => onpage?.(page - 1)}
		>
			Sebelumnya
		</button>
		<span class="tabular-nums text-ink">{page} / {Math.max(totalPages, 1)}</span>
		<button
			type="button"
			class="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 disabled:opacity-40"
			disabled={page >= totalPages}
			onclick={() => onpage?.(page + 1)}
		>
			Berikutnya
		</button>
	</div>
</div>
