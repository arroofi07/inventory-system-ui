<script lang="ts">
	import Pagination from '$lib/components/data/Pagination.svelte';
	import FilterBar from '$lib/components/data/FilterBar.svelte';
	import Field from '$lib/components/form/Field.svelte';
	import Combobox from '$lib/components/form/Combobox.svelte';
	import Skeleton from '$lib/components/feedback/Skeleton.svelte';
	import EmptyState from '$lib/components/data/EmptyState.svelte';
	import {
		daftarLaporanPenjualan,
		unduhEksporPenjualan,
		type LaporanPenjualanItem,
		type LaporanPenjualanRingkasan
	} from '$lib/api/laporan';
	import type { PageMeta } from '$lib/api/barang';
	import { formatRupiah } from '$lib/domain/format';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { resolveAppPath } from '$lib/nav';
	import { ApiError } from '$lib/api/http';

	let q = $state('');
	let channel = $state('');
	let salesId = $state('');
	let statusBayar = $state('');
	let dateFrom = $state('');
	let dateTo = $state('');
	let page = $state(1);
	let rows = $state<LaporanPenjualanItem[]>([]);
	let meta = $state<PageMeta>({ page: 1, per_page: 20, total: 0, total_pages: 1 });
	let ringkasan = $state<LaporanPenjualanRingkasan>({
		jumlah_transaksi: 0,
		total_penjualan: '0.00'
	});
	let loading = $state(true);
	let debounce: ReturnType<typeof setTimeout> | undefined;

	const bisaEkspor = $derived(auth.punyaIzin('laporan.ekspor'));

	const channelOpts = [
		{ value: '', label: 'Semua channel' },
		{ value: 'Modern Trade', label: 'Modern Trade' },
		{ value: 'Modern Trade Independent', label: 'Modern Trade Independent' },
		{ value: 'General Trade', label: 'General Trade' },
		{ value: 'General Trade Kosmetik', label: 'General Trade Kosmetik' },
		{ value: 'Sub Agen', label: 'Sub Agen' }
	];
	const bayarOpts = [
		{ value: '', label: 'Semua bayar' },
		{ value: 'lunas', label: 'Lunas' },
		{ value: 'hutang', label: 'Hutang' },
		{ value: 'sebagian', label: 'Sebagian' }
	];

	function params() {
		const sid = salesId.trim() ? Number(salesId) : undefined;
		return {
			q: q || undefined,
			channel_outlet: channel || undefined,
			sales_id: sid && Number.isFinite(sid) ? sid : undefined,
			status_pembayaran: statusBayar || undefined,
			date_from: dateFrom || undefined,
			date_to: dateTo || undefined,
			page,
			per_page: 20
		};
	}

	async function muat() {
		loading = true;
		try {
			const res = await daftarLaporanPenjualan(params());
			rows = res.data;
			meta = res.meta;
			ringkasan = res.ringkasan;
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal memuat laporan penjualan', 'bahaya');
			rows = [];
		} finally {
			loading = false;
		}
	}

	function jadwalkanMuat() {
		clearTimeout(debounce);
		debounce = setTimeout(() => void muat(), 200);
	}

	$effect(() => {
		void q;
		void channel;
		void salesId;
		void statusBayar;
		void dateFrom;
		void dateTo;
		void page;
		jadwalkanMuat();
		return () => clearTimeout(debounce);
	});

	function resetFilter() {
		q = '';
		channel = '';
		salesId = '';
		statusBayar = '';
		dateFrom = '';
		dateTo = '';
		page = 1;
	}

	async function unduh() {
		try {
			await unduhEksporPenjualan(params());
			showToast('CSV penjualan (approved) diunduh', 'sukses');
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal ekspor', 'bahaya');
		}
	}
</script>

<div class="space-y-4">
	<header class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="font-display text-2xl text-ink">Laporan Penjualan</h1>
			<p class="text-sm text-muted">
				Default approved. Filter periode, channel, dan sales — konsisten dengan ekspor.
			</p>
		</div>
		{#if bisaEkspor}
			<button
				type="button"
				class="rounded border border-slate-300 bg-white px-3 py-2 text-sm hover:border-brand-300"
				onclick={() => void unduh()}
			>
				Ekspor CSV
			</button>
		{/if}
	</header>

	<div class="grid gap-3 sm:grid-cols-2">
		<div class="rounded border border-slate-200 bg-white px-3 py-2">
			<p class="text-xs text-slate-500">Jumlah transaksi</p>
			<p class="text-lg font-semibold tabular-nums">{ringkasan.jumlah_transaksi}</p>
		</div>
		<div class="rounded border border-slate-200 bg-white px-3 py-2">
			<p class="text-xs text-slate-500">Total penjualan</p>
			<p class="text-lg font-semibold tabular-nums">{formatRupiah(ringkasan.total_penjualan)}</p>
		</div>
	</div>

	<FilterBar onreset={resetFilter}>
		<Field label="Cari">
			<input class="input" bind:value={q} placeholder="No trx / pelanggan" />
		</Field>
		<Field label="Channel">
			<Combobox options={channelOpts} bind:value={channel} />
		</Field>
		<Field label="Sales ID">
			<input class="input" bind:value={salesId} placeholder="opsional" inputmode="numeric" />
		</Field>
		<Field label="Status bayar">
			<Combobox options={bayarOpts} bind:value={statusBayar} />
		</Field>
		<Field label="Dari">
			<input class="input" type="date" bind:value={dateFrom} />
		</Field>
		<Field label="Sampai">
			<input class="input" type="date" bind:value={dateTo} />
		</Field>
	</FilterBar>

	{#if loading}
		<Skeleton class="h-48 w-full" />
	{:else if rows.length === 0}
		<EmptyState title="Tidak ada data" description="Tidak ada penjualan approved untuk filter ini." />
	{:else}
		<div class="overflow-x-auto rounded border border-slate-200">
			<table class="min-w-full text-left text-sm">
				<thead class="bg-slate-50 text-xs uppercase text-slate-500">
					<tr>
						<th class="px-3 py-2">Tanggal</th>
						<th class="px-3 py-2">No</th>
						<th class="px-3 py-2">Pelanggan</th>
						<th class="px-3 py-2">Channel</th>
						<th class="px-3 py-2">Area</th>
						<th class="px-3 py-2 text-right">Qty</th>
						<th class="px-3 py-2">Bayar</th>
						<th class="px-3 py-2 text-right">Total</th>
					</tr>
				</thead>
				<tbody>
					{#each rows as row (row.id)}
						<tr class="border-t border-slate-100">
							<td class="px-3 py-2 tabular-nums">{row.tanggal}</td>
							<td class="px-3 py-2">
								<a class="font-mono text-xs text-brand-700 underline" href={resolveAppPath(`/transaksi/${row.id}`)}>
									{row.no_transaksi ?? row.id}
								</a>
							</td>
							<td class="px-3 py-2">
								<span class="block text-xs text-slate-500">{row.kode_pelanggan}</span>
								{row.nama_pelanggan}
							</td>
							<td class="px-3 py-2">{row.channel_outlet}</td>
							<td class="px-3 py-2">{row.area}</td>
							<td class="px-3 py-2 text-right tabular-nums">
								{row.total_qty_ditagih}/{row.total_qty_keluar}
							</td>
							<td class="px-3 py-2">{row.status_pembayaran}</td>
							<td class="px-3 py-2 text-right tabular-nums">{formatRupiah(row.total_akhir)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<Pagination
			page={meta.page}
			total={meta.total}
			totalPages={meta.total_pages}
			onpage={(p) => (page = p)}
		/>
	{/if}
</div>
