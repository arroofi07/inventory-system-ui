<script lang="ts">
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
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="stok-kurang-title"
	>
		<div class="w-full max-w-lg rounded-lg bg-white p-4 shadow-lg">
			<h2 id="stok-kurang-title" class="text-base font-semibold text-slate-900">Stok tidak cukup</h2>
			<p class="mt-1 text-sm text-slate-600">
				Beberapa SKU kekurangan stok. Cek ini bersifat sementara — jaminan hanya saat approval.
			</p>

			<ul class="mt-3 max-h-56 space-y-2 overflow-y-auto text-sm">
				{#each kurang as row (row.kode_item + String(row.qty_diminta))}
					<li class="rounded border border-amber-200 bg-amber-50 px-3 py-2">
						<div class="font-medium text-slate-900">{row.nama_item}</div>
						<div class="text-slate-600">
							{row.kode_item}: diminta {row.qty_diminta}, tersedia {row.stok_tersedia}
						</div>
					</li>
				{/each}
			</ul>

			{#if catatan}
				<p class="mt-3 text-xs text-slate-500">{catatan}</p>
			{/if}

			<div class="mt-4 flex flex-wrap justify-end gap-2">
				<button
					type="button"
					class="rounded border border-slate-300 px-3 py-1.5 text-sm"
					onclick={() => {
						open = false;
						onkurangi?.();
					}}
				>
					Kurangi qty
				</button>
				<button
					type="button"
					class="rounded bg-slate-900 px-3 py-1.5 text-sm text-white"
					onclick={() => {
						open = false;
						onlanjut?.();
					}}
				>
					Lanjut dengan risiko
				</button>
			</div>
		</div>
	</div>
{/if}
