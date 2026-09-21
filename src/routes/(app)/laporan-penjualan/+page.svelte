<script lang="ts">
	import Pagination from '$lib/components/data/Pagination.svelte';
	import FilterBar from '$lib/components/data/FilterBar.svelte';
	import StatCard from '$lib/components/data/StatCard.svelte';
	import Field from '$lib/components/form/Field.svelte';
	import Combobox from '$lib/components/form/Combobox.svelte';
	import Skeleton from '$lib/components/feedback/Skeleton.svelte';
	import EmptyState from '$lib/components/data/EmptyState.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import {
		daftarLaporanPenjualan,
		unduhEksporPenjualan,
		type LaporanPenjualanItem,
		type LaporanPenjualanRingkasan
	} from '$lib/api/laporan';
	import { CHANNEL_OUTLET_OPTIONS } from '$lib/api/pelanggan';
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
		...CHANNEL_OUTLET_OPTIONS.map((o) => ({ value: o.value, label: o.label }))
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
			<Button variant="outline" onclick={() => void unduh()}>Ekspor CSV</Button>
		{/if}
	</header>

	<div class="grid gap-3 sm:grid-cols-2">
		<StatCard label="Jumlah transaksi" value={String(ringkasan.jumlah_transaksi)} />
		<StatCard label="Total penjualan" value={formatRupiah(ringkasan.total_penjualan)} />
	</div>

	<FilterBar onreset={resetFilter}>
		<Field label="Cari" forId="lp-q">
			<Input id="lp-q" class="w-full" bind:value={q} placeholder="No trx / pelanggan" />
		</Field>
		<Field label="Channel" forId="lp-ch">
			<Combobox id="lp-ch" options={channelOpts} bind:value={channel} />
		</Field>
		<Field label="Sales ID" forId="lp-sid">
			<Input
				id="lp-sid"
				class="w-full"
				bind:value={salesId}
				placeholder="opsional"
				inputmode="numeric"
			/>
		</Field>
		<Field label="Status bayar" forId="lp-sb">
			<Combobox id="lp-sb" options={bayarOpts} bind:value={statusBayar} />
		</Field>
		<Field label="Dari" forId="lp-df">
			<Input id="lp-df" class="w-full" type="date" bind:value={dateFrom} />
		</Field>
		<Field label="Sampai" forId="lp-dt">
			<Input id="lp-dt" class="w-full" type="date" bind:value={dateTo} />
		</Field>
	</FilterBar>

	{#if loading}
		<Skeleton class="h-48 w-full" />
	{:else if rows.length === 0}
		<EmptyState title="Tidak ada data" description="Tidak ada penjualan approved untuk filter ini." />
	{:else}
		<div class="overflow-hidden rounded-[var(--radius-card)] border border-primary/20 bg-white">
			<Table.Root>
				<Table.Header>
					<Table.Row class="hover:bg-transparent">
						<Table.Head class="px-3 py-2">Tanggal</Table.Head>
						<Table.Head class="px-3 py-2">No</Table.Head>
						<Table.Head class="px-3 py-2">Pelanggan</Table.Head>
						<Table.Head class="px-3 py-2">Channel</Table.Head>
						<Table.Head class="px-3 py-2">Area</Table.Head>
						<Table.Head class="px-3 py-2 text-right">Qty</Table.Head>
						<Table.Head class="px-3 py-2">Bayar</Table.Head>
						<Table.Head class="px-3 py-2 text-right">Total</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each rows as row (row.id)}
						<Table.Row>
							<Table.Cell class="px-3 py-2 tabular-nums">{row.tanggal}</Table.Cell>
							<Table.Cell class="px-3 py-2">
								<Button
									variant="link"
									class="h-auto p-0 font-mono text-xs"
									href={resolveAppPath(`/transaksi/${row.id}`)}
								>
									{row.no_transaksi ?? row.id}
								</Button>
							</Table.Cell>
							<Table.Cell class="px-3 py-2">
								<span class="block text-xs text-primary/70">{row.kode_pelanggan}</span>
								{row.nama_pelanggan}
							</Table.Cell>
							<Table.Cell class="px-3 py-2">{row.channel_outlet}</Table.Cell>
							<Table.Cell class="px-3 py-2">{row.area}</Table.Cell>
							<Table.Cell class="px-3 py-2 text-right tabular-nums">
								{row.total_qty_ditagih}/{row.total_qty_keluar}
							</Table.Cell>
							<Table.Cell class="px-3 py-2">{row.status_pembayaran}</Table.Cell>
							<Table.Cell class="px-3 py-2 text-right tabular-nums"
								>{formatRupiah(row.total_akhir)}</Table.Cell
							>
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
