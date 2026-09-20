<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		riwayatTransaksiPelanggan,
		type RiwayatTransaksiItem
	} from '$lib/api/pelanggan';
	import { formatRupiah } from '$lib/domain/format';
	import { ApiError } from '$lib/api/http';

	interface Props {
		open?: boolean;
		kodePelanggan?: string;
		namaPelanggan?: string;
	}

	let {
		open = $bindable(false),
		kodePelanggan = '',
		namaPelanggan = ''
	}: Props = $props();

	let items = $state<RiwayatTransaksiItem[]>([]);
	let loading = $state(false);
	let error = $state('');
	let loadedFor = $state('');

	async function muat() {
		if (!kodePelanggan || loadedFor === kodePelanggan) return;
		loading = true;
		error = '';
		try {
			const res = await riwayatTransaksiPelanggan(kodePelanggan);
			items = res.data ?? [];
			loadedFor = kodePelanggan;
		} catch (e) {
			items = [];
			error = e instanceof ApiError ? e.body.message : 'Gagal memuat riwayat';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (open && kodePelanggan) {
			void muat();
		}
		if (!open) {
			loadedFor = '';
		}
	});
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="riwayat-outlet-title"
	>
		<div class="w-full max-h-[90dvh] overflow-auto rounded-t-2xl bg-card p-4 shadow-lg sm:max-w-lg sm:rounded-2xl">
			<div class="flex items-start justify-between gap-2">
				<div>
					<h2 id="riwayat-outlet-title" class="text-base font-semibold">
						Riwayat outlet
					</h2>
					<p class="text-sm text-muted-foreground">
						{namaPelanggan || kodePelanggan}
						{#if namaPelanggan && kodePelanggan}
							<span class="text-muted-foreground/70">({kodePelanggan})</span>
						{/if}
					</p>
				</div>
				<Button type="button" variant="outline" size="sm" onclick={() => (open = false)}>
					Tutup
				</Button>
			</div>

			{#if loading}
				<p class="mt-4 text-sm text-muted-foreground">Memuat…</p>
			{:else if error}
				<p class="mt-4 text-sm text-destructive">{error}</p>
			{:else if items.length === 0}
				<p class="mt-4 text-sm text-muted-foreground">Belum ada transaksi untuk outlet ini.</p>
			{:else}
				<ul class="mt-3 max-h-72 space-y-2 overflow-y-auto text-sm">
					{#each items as row (row.id)}
						<li class="rounded-2xl border border-border px-3 py-2">
							<div class="flex justify-between gap-2">
								<span class="font-medium">{row.tanggal}</span>
								<span>{formatRupiah(row.total_akhir)}</span>
							</div>
							<div class="text-muted-foreground">
								#{row.id}
								{#if row.no_transaksi}
									· {row.no_transaksi}
								{/if}
								· {row.status_approval}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
{/if}
