<script lang="ts">
	import Pagination from '$lib/components/data/Pagination.svelte';
	import FilterBar from '$lib/components/data/FilterBar.svelte';
	import Field from '$lib/components/form/Field.svelte';
	import Skeleton from '$lib/components/feedback/Skeleton.svelte';
	import EmptyState from '$lib/components/data/EmptyState.svelte';
	import {
		daftarBarangKeluar,
		unduhEksporBarangKeluar,
		type BarisBarangKeluar,
		type LaporanBarangKeluarRingkasan
	} from '$lib/api/laporan';
	import type { PageMeta } from '$lib/api/barang';
	import { formatRupiah } from '$lib/domain/format';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { ApiError } from '$lib/api/http';

	let q = $state('');
	let brand = $state('');
	let kodeItem = $state('');
	let dateFrom = $state('');
	let dateTo = $state('');
	let page = $state(1);
	let rows = $state<BarisBarangKeluar[]>([]);
	let meta = $state<PageMeta>({ page: 1, per_page: 20, total: 0, total_pages: 1 });
	let ringkasan = $state<LaporanBarangKeluarRingkasan>({
		total_qty_keluar: 0,
		total_final: '0.00'
	});
	let loading = $state(true);
	let debounce: ReturnType<typeof setTimeout> | undefined;

	const bisaEkspor = $derived(auth.punyaIzin('laporan.ekspor'));
	const lihatLaba = $derived(auth.punyaIzin('laporan.laba'));

	function params() {
		return {
			q: q || undefined,
			brand: brand || undefined,
			kode_item: kodeItem || undefined,
			date_from: dateFrom || undefined,
			date_to: dateTo || undefined,
			page,
			per_page: 20
		};
	}

	async function muat() {
		loading = true;
		try {
			const res = await daftarBarangKeluar(params());
			rows = res.data;
			meta = res.meta;
			ringkasan = res.ringkasan;
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal memuat barang keluar', 'bahaya');
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
		void brand;
		void kodeItem;
		void dateFrom;
		void dateTo;
		void page;
		jadwalkanMuat();
		return () => clearTimeout(debounce);
	});

	function resetFilter() {
		q = '';
		brand = '';
		kodeItem = '';
		dateFrom = '';
		dateTo = '';
		page = 1;
	}

	async function unduh() {
		try {
			await unduhEksporBarangKeluar(params());
			showToast('CSV barang keluar diunduh', 'sukses');
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal ekspor', 'bahaya');
		}
	}
</script>

<div class="space-y-4">
	<header class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="font-display text-2xl text-ink">Barang Keluar</h1>
			<p class="text-sm text-muted">
				Penjualan approved; laba memakai total qty keluar (termasuk promo).
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

	<div class="grid gap-3 sm:grid-cols-2 {lihatLaba ? 'lg:grid-cols-4' : ''}">
		<div class="rounded border border-slate-200 bg-white px-3 py-2">
			<p class="text-xs text-slate-500">Total qty keluar</p>
			<p class="text-lg font-semibold tabular-nums">{ringkasan.total_qty_keluar}</p>
		</div>
		<div class="rounded border border-slate-200 bg-white px-3 py-2">
			<p class="text-xs text-slate-500">Total final</p>
			<p class="text-lg font-semibold tabular-nums">{formatRupiah(ringkasan.total_final)}</p>
		</div>
		{#if lihatLaba && ringkasan.total_hpp != null}
			<div class="rounded border border-slate-200 bg-white px-3 py-2">
				<p class="text-xs text-slate-500">Total HPP</p>
				<p class="text-lg font-semibold tabular-nums">{formatRupiah(ringkasan.total_hpp)}</p>
			</div>
		{/if}
		{#if lihatLaba && ringkasan.total_provit != null}
			<div class="rounded border border-slate-200 bg-white px-3 py-2">
				<p class="text-xs text-slate-500">Total provit</p>
				<p class="text-lg font-semibold tabular-nums">{formatRupiah(ringkasan.total_provit)}</p>
			</div>
		{/if}
	</div>

	<FilterBar onreset={resetFilter}>
		<Field label="Cari">
			<input class="input" bind:value={q} placeholder="No trx / pelanggan / item" />
		</Field>
		<Field label="Kode item">
			<input class="input" bind:value={kodeItem} placeholder="SKU" />
		</Field>
		<Field label="Brand">
			<input class="input" bind:value={brand} placeholder="Brand" />
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
		<EmptyState title="Tidak ada data" description="Belum ada penjualan approved untuk filter ini." />
	{:else}
		<div class="overflow-x-auto rounded border border-slate-200">
			<table class="min-w-full text-left text-sm">
				<thead class="bg-slate-50 text-xs uppercase text-slate-500">
					<tr>
						<th class="px-3 py-2">Tanggal</th>
						<th class="px-3 py-2">No trx</th>
						<th class="px-3 py-2">Pelanggan</th>
						{#if lihatLaba}
							<th class="px-3 py-2">Alamat</th>
						{/if}
						<th class="px-3 py-2">Item</th>
						<th class="px-3 py-2 text-right">Qty</th>
						<th class="px-3 py-2 text-right">Promo</th>
						<th class="px-3 py-2 text-right">Keluar</th>
						<th class="px-3 py-2 text-right">Final</th>
						{#if lihatLaba}
							<th class="px-3 py-2 text-right">HPP</th>
							<th class="px-3 py-2 text-right">Provit</th>
							<th class="px-3 py-2 text-right">Margin %</th>
						{/if}
					</tr>
				</thead>
				<tbody>
					{#each rows as row (row.transaksi_id + '-' + row.kode_item + '-' + row.qty)}
						<tr class="border-t border-slate-100">
							<td class="px-3 py-2 tabular-nums">{row.tanggal}</td>
							<td class="px-3 py-2 font-mono text-xs">{row.no_transaksi ?? '—'}</td>
							<td class="px-3 py-2">
								<span class="block text-xs text-slate-500">{row.kode_pelanggan}</span>
								{row.nama_pelanggan}
							</td>
							{#if lihatLaba}
								<td class="max-w-[12rem] truncate px-3 py-2 text-xs text-slate-600">
									{row.alamat ?? '—'}
								</td>
							{/if}
							<td class="px-3 py-2">
								<span class="block font-mono text-xs">{row.kode_item}</span>
								{row.nama_item}
							</td>
							<td class="px-3 py-2 text-right tabular-nums">{row.qty}</td>
							<td class="px-3 py-2 text-right tabular-nums">{row.qty_promo}</td>
							<td class="px-3 py-2 text-right tabular-nums font-medium">{row.total_qty_keluar}</td>
							<td class="px-3 py-2 text-right tabular-nums">{formatRupiah(row.total_final_baris)}</td>
							{#if lihatLaba}
								<td class="px-3 py-2 text-right tabular-nums">
									{row.hpp_total ? formatRupiah(row.hpp_total) : '—'}
								</td>
								<td class="px-3 py-2 text-right tabular-nums">
									{row.provit ? formatRupiah(row.provit) : '—'}
								</td>
								<td class="px-3 py-2 text-right tabular-nums">{row.margin_persen ?? '—'}</td>
							{/if}
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
