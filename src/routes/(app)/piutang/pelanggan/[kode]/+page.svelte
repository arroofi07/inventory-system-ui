<script lang="ts">
	import { page } from '$app/state';
	import Pagination from '$lib/components/data/Pagination.svelte';
	import Skeleton from '$lib/components/feedback/Skeleton.svelte';
	import EmptyState from '$lib/components/data/EmptyState.svelte';
	import BayarModal from '$lib/components/piutang/BayarModal.svelte';
	import {
		piutangPelanggan,
		riwayatPiutangPelanggan,
		type PiutangItem,
		type PiutangRingkasan,
		type RiwayatPembayaranItem
	} from '$lib/api/piutang';
	import type { PageMeta } from '$lib/api/barang';
	import { formatRupiah } from '$lib/domain/format';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { resolveAppPath } from '$lib/nav';
	import { ApiError } from '$lib/api/http';

	const kode = $derived(decodeURIComponent(page.params.kode ?? ''));

	let pageNum = $state(1);
	let rows = $state<PiutangItem[]>([]);
	let meta = $state<PageMeta>({ page: 1, per_page: 20, total: 0, total_pages: 1 });
	let ringkasan = $state<PiutangRingkasan>({
		total_nilai: '0',
		total_dibayar: '0',
		total_piutang: '0',
		piutang_overdue: '0',
		jumlah_transaksi: 0,
		jumlah_transaksi_overdue: 0
	});
	let riwayat = $state<RiwayatPembayaranItem[]>([]);
	let loading = $state(true);
	let bayarOpen = $state(false);
	let bayarRow = $state<PiutangItem | null>(null);

	const bisaBayar = $derived(auth.punyaIzin('pembayaran.catat'));
	const namaPelanggan = $derived(rows[0]?.nama_pelanggan ?? kode);

	async function muat() {
		if (!kode) return;
		loading = true;
		try {
			const [listRes, riwRes] = await Promise.all([
				piutangPelanggan(kode, { page: pageNum, per_page: 20 }),
				riwayatPiutangPelanggan(kode)
			]);
			rows = listRes.data;
			meta = listRes.meta;
			ringkasan = listRes.ringkasan;
			riwayat = riwRes.data;
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal memuat', 'bahaya');
			rows = [];
			riwayat = [];
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		void kode;
		void pageNum;
		void muat();
	});
</script>

<div class="space-y-4">
	<header>
		<a class="text-sm text-brand-700 underline" href={resolveAppPath('/piutang')}>← Piutang</a>
		<h1 class="font-display mt-2 text-2xl text-ink">{namaPelanggan}</h1>
		<p class="text-sm text-muted">Kode {kode}</p>
	</header>

	<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
		<div class="rounded border border-slate-200 bg-white px-3 py-2">
			<p class="text-xs text-slate-500">Total nilai</p>
			<p class="tabular-nums text-sm font-semibold">{formatRupiah(ringkasan.total_nilai)}</p>
		</div>
		<div class="rounded border border-slate-200 bg-white px-3 py-2">
			<p class="text-xs text-slate-500">Dibayar</p>
			<p class="tabular-nums text-sm font-semibold">{formatRupiah(ringkasan.total_dibayar)}</p>
		</div>
		<div class="rounded border border-slate-200 bg-white px-3 py-2">
			<p class="text-xs text-slate-500">Sisa piutang</p>
			<p class="tabular-nums text-sm font-semibold">{formatRupiah(ringkasan.total_piutang)}</p>
		</div>
		<div class="rounded border border-red-200 bg-red-50 px-3 py-2">
			<p class="text-xs text-red-700">Overdue</p>
			<p class="tabular-nums text-sm font-semibold text-red-900">
				{formatRupiah(ringkasan.piutang_overdue)}
			</p>
		</div>
	</div>

	<section class="space-y-2">
		<h2 class="font-display text-lg text-ink">Transaksi</h2>
		{#if loading}
			<Skeleton class="h-32 w-full" />
		{:else if rows.length === 0}
			<EmptyState title="Tidak ada transaksi" description="Pelanggan ini tidak punya piutang." />
		{:else}
			<div class="overflow-x-auto rounded border border-slate-200 bg-white">
				<table class="min-w-full text-left text-sm">
					<thead class="border-b bg-slate-50 text-xs uppercase text-slate-500">
						<tr>
							<th class="px-3 py-2">No / ID</th>
							<th class="px-3 py-2">Tanggal</th>
							<th class="px-3 py-2 text-right">Total</th>
							<th class="px-3 py-2 text-right">Dibayar</th>
							<th class="px-3 py-2 text-right">Sisa</th>
							<th class="px-3 py-2">Status</th>
							<th class="px-3 py-2">Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each rows as r (r.transaksi_id)}
							<tr class="border-b border-slate-100">
								<td class="px-3 py-2 tabular-nums">{r.no_transaksi ?? `#${r.transaksi_id}`}</td>
								<td class="px-3 py-2 whitespace-nowrap">{r.tanggal?.slice(0, 10) ?? '—'}</td>
								<td class="px-3 py-2 text-right tabular-nums">{formatRupiah(r.total_akhir)}</td>
								<td class="px-3 py-2 text-right tabular-nums">{formatRupiah(r.jumlah_dibayar)}</td>
								<td class="px-3 py-2 text-right tabular-nums">{formatRupiah(r.sisa_hutang)}</td>
								<td class="px-3 py-2">{r.status_pembayaran}</td>
								<td class="px-3 py-2">
									{#if bisaBayar && r.status_pembayaran !== 'lunas'}
										<button
											type="button"
											class="text-sm text-brand-700 underline"
											onclick={() => {
												bayarRow = r;
												bayarOpen = true;
											}}
										>
											Bayar
										</button>
									{:else}
										—
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<Pagination
				page={meta.page}
				total={meta.total}
				totalPages={meta.total_pages}
				onpage={(p) => (pageNum = p)}
			/>
		{/if}
	</section>

	<section class="space-y-2">
		<h2 class="font-display text-lg text-ink">Riwayat pembayaran</h2>
		{#if riwayat.length === 0}
			<p class="text-sm text-muted">Belum ada riwayat.</p>
		{:else}
			<div class="overflow-x-auto rounded border border-slate-200 bg-white">
				<table class="min-w-full text-left text-sm">
					<thead class="border-b bg-slate-50 text-xs uppercase text-slate-500">
						<tr>
							<th class="px-3 py-2">Waktu</th>
							<th class="px-3 py-2 text-right">Nominal</th>
							<th class="px-3 py-2">Status</th>
							<th class="px-3 py-2">Metode</th>
							<th class="px-3 py-2">Keterangan</th>
						</tr>
					</thead>
					<tbody>
						{#each riwayat as h (h.id)}
							<tr class="border-b border-slate-100">
								<td class="px-3 py-2 whitespace-nowrap">{h.changed_at?.slice(0, 19) ?? '—'}</td>
								<td class="px-3 py-2 text-right tabular-nums"
									>{formatRupiah(h.nominal_pembayaran)}</td
								>
								<td class="px-3 py-2 text-xs">
									{h.old_status ?? '—'} → {h.new_status ?? '—'}
								</td>
								<td class="px-3 py-2">{h.metode_pembayaran ?? '—'}</td>
								<td class="px-3 py-2 text-muted">{h.keterangan ?? '—'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>

<BayarModal bind:open={bayarOpen} row={bayarRow} onsukses={() => void muat()} />
