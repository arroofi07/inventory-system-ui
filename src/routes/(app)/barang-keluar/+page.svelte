<script lang="ts">
	import Pagination from '$lib/components/data/Pagination.svelte';
	import FilterBar from '$lib/components/data/FilterBar.svelte';
	import StatCard from '$lib/components/data/StatCard.svelte';
	import Field from '$lib/components/form/Field.svelte';
	import Skeleton from '$lib/components/feedback/Skeleton.svelte';
	import EmptyState from '$lib/components/data/EmptyState.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
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
			<Button variant="outline" onclick={() => void unduh()}>Ekspor CSV</Button>
		{/if}
	</header>

	<div class="grid gap-3 sm:grid-cols-2 {lihatLaba ? 'lg:grid-cols-4' : ''}">
		<StatCard label="Total qty keluar" value={String(ringkasan.total_qty_keluar)} />
		<StatCard label="Total final" value={formatRupiah(ringkasan.total_final)} />
		{#if lihatLaba && ringkasan.total_hpp != null}
			<StatCard label="Total HPP" value={formatRupiah(ringkasan.total_hpp)} />
		{/if}
		{#if lihatLaba && ringkasan.total_provit != null}
			<StatCard label="Total provit" value={formatRupiah(ringkasan.total_provit)} />
		{/if}
	</div>

	<FilterBar onreset={resetFilter}>
		<Field label="Cari" forId="bk-q">
			<Input id="bk-q" class="w-full" bind:value={q} placeholder="No trx / pelanggan / item" />
		</Field>
		<Field label="Kode item" forId="bk-ki">
			<Input id="bk-ki" class="w-full" bind:value={kodeItem} placeholder="SKU" />
		</Field>
		<Field label="Brand" forId="bk-br">
			<Input id="bk-br" class="w-full" bind:value={brand} placeholder="Brand" />
		</Field>
		<Field label="Dari" forId="bk-df">
			<Input id="bk-df" class="w-full" type="date" bind:value={dateFrom} />
		</Field>
		<Field label="Sampai" forId="bk-dt">
			<Input id="bk-dt" class="w-full" type="date" bind:value={dateTo} />
		</Field>
	</FilterBar>

	{#if loading}
		<Skeleton class="h-48 w-full" />
	{:else if rows.length === 0}
		<EmptyState title="Tidak ada data" description="Belum ada penjualan approved untuk filter ini." />
	{:else}
		<div class="overflow-hidden rounded-[var(--radius-card)] border border-primary/20 bg-white">
			<Table.Root>
				<Table.Header>
					<Table.Row class="hover:bg-transparent">
						<Table.Head class="px-3 py-2">Tanggal</Table.Head>
						<Table.Head class="px-3 py-2">No trx</Table.Head>
						<Table.Head class="px-3 py-2">Pelanggan</Table.Head>
						{#if lihatLaba}
							<Table.Head class="px-3 py-2">Alamat</Table.Head>
						{/if}
						<Table.Head class="px-3 py-2">Item</Table.Head>
						<Table.Head class="px-3 py-2 text-right">Qty</Table.Head>
						<Table.Head class="px-3 py-2 text-right">Promo</Table.Head>
						<Table.Head class="px-3 py-2 text-right">Keluar</Table.Head>
						<Table.Head class="px-3 py-2 text-right">Final</Table.Head>
						{#if lihatLaba}
							<Table.Head class="px-3 py-2 text-right">HPP</Table.Head>
							<Table.Head class="px-3 py-2 text-right">Provit</Table.Head>
							<Table.Head class="px-3 py-2 text-right">Margin %</Table.Head>
						{/if}
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each rows as row (row.transaksi_id + '-' + row.kode_item + '-' + row.qty)}
						<Table.Row>
							<Table.Cell class="px-3 py-2 tabular-nums">{row.tanggal}</Table.Cell>
							<Table.Cell class="px-3 py-2 font-mono text-xs">{row.no_transaksi ?? '—'}</Table.Cell>
							<Table.Cell class="px-3 py-2">
								<span class="block text-xs text-primary/70">{row.kode_pelanggan}</span>
								{row.nama_pelanggan}
							</Table.Cell>
							{#if lihatLaba}
								<Table.Cell class="max-w-[12rem] truncate px-3 py-2 text-xs text-muted-foreground">
									{row.alamat ?? '—'}
								</Table.Cell>
							{/if}
							<Table.Cell class="px-3 py-2">
								<span class="block font-mono text-xs">{row.kode_item}</span>
								{row.nama_item}
							</Table.Cell>
							<Table.Cell class="px-3 py-2 text-right tabular-nums">{row.qty}</Table.Cell>
							<Table.Cell class="px-3 py-2 text-right tabular-nums">{row.qty_promo}</Table.Cell>
							<Table.Cell class="px-3 py-2 text-right font-medium tabular-nums"
								>{row.total_qty_keluar}</Table.Cell
							>
							<Table.Cell class="px-3 py-2 text-right tabular-nums"
								>{formatRupiah(row.total_final_baris)}</Table.Cell
							>
							{#if lihatLaba}
								<Table.Cell class="px-3 py-2 text-right tabular-nums">
									{row.hpp_total ? formatRupiah(row.hpp_total) : '—'}
								</Table.Cell>
								<Table.Cell class="px-3 py-2 text-right tabular-nums">
									{row.provit ? formatRupiah(row.provit) : '—'}
								</Table.Cell>
								<Table.Cell class="px-3 py-2 text-right tabular-nums"
									>{row.margin_persen ?? '—'}</Table.Cell
								>
							{/if}
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
		<Pagination
			page={meta.page}
			total={meta.total}
			totalPages={meta.total_pages}
			onpage={(p) => (page = p)}
		/>
	{/if}
</div>
