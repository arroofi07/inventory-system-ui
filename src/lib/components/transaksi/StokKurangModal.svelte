<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import type { CekStokItem } from '$lib/api/transaksi';

	interface Props {
		open?: boolean;
		items?: CekStokItem[];
		catatan?: string;
		/** Dipanggil saat user memilih mengurangi qty / menutup untuk koreksi. */
		onkurangi?: () => void;
		/**
		 * Dipanggil bila user tetap lanjut (risiko: store/approval bisa menolak).
		 * Soft-check bukan jaminan.
		 */
		onlanjut?: () => void;
	}

	let {
		open = $bindable(false),
		items = [],
		catatan = '',
		onkurangi,
		onlanjut
	}: Props = $props();

	const kurang = $derived(items.filter((i) => !i.stok_cukup));
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="stok-kurang-title"
	>
		<div class="w-full max-h-[90dvh] overflow-auto rounded-t-2xl bg-card p-4 shadow-lg sm:max-w-lg sm:rounded-2xl">
			<h2 id="stok-kurang-title" class="text-base font-semibold">Stok tidak cukup</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Beberapa SKU kekurangan stok. Cek ini bersifat sementara — jaminan hanya saat approval.
			</p>

			<ul class="mt-3 max-h-56 space-y-2 overflow-y-auto text-sm">
				{#each kurang as row (row.kode_item + String(row.qty_diminta))}
					<li class="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2">
						<div class="font-medium">{row.nama_item}</div>
						<div class="text-muted-foreground">
							{row.kode_item}: diminta {row.qty_diminta}, tersedia {row.stok_tersedia}
						</div>
					</li>
				{/each}
			</ul>

			{#if catatan}
				<p class="mt-3 text-xs text-muted-foreground">{catatan}</p>
			{/if}

			<div class="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
				<Button
					type="button"
					variant="outline"
					class="min-h-11 sm:min-h-0"
					onclick={() => {
						open = false;
						onkurangi?.();
					}}
				>
					Kurangi qty
				</Button>
				<Button
					type="button"
					class="min-h-11 sm:min-h-0"
					onclick={() => {
						open = false;
						onlanjut?.();
					}}
				>
					Lanjut dengan risiko
				</Button>
			</div>
		</div>
	</div>
{/if}
