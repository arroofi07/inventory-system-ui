<script lang="ts">
	import FilterBar from '$lib/components/data/FilterBar.svelte';
	import Field from '$lib/components/form/Field.svelte';
	import Skeleton from '$lib/components/feedback/Skeleton.svelte';
	import EmptyState from '$lib/components/data/EmptyState.svelte';
	import BarChart from '$lib/components/chart/BarChart.svelte';
	import LineChart from '$lib/components/chart/LineChart.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import {
		ambilChannelAnalytics,
		unduhEksporChannelAnalytics,
		type ChannelAnalyticsData
	} from '$lib/api/laporan';
	import { formatRupiah } from '$lib/domain/format';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { ApiError } from '$lib/api/http';

	let dateFrom = $state('');
	let dateTo = $state('');
	let data = $state<ChannelAnalyticsData | null>(null);
	let loading = $state(true);
	let debounce: ReturnType<typeof setTimeout> | undefined;

	const bisaEkspor = $derived(auth.punyaIzin('laporan.analytics'));

	function params() {
		return {
			date_from: dateFrom || undefined,
			date_to: dateTo || undefined,
			limit: 15
		};
	}

	async function muat() {
		loading = true;
		try {
			const res = await ambilChannelAnalytics(params());
			data = res.data;
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal memuat analytics', 'bahaya');
			data = null;
		} finally {
			loading = false;
		}
	}

	function jadwalkanMuat() {
		clearTimeout(debounce);
		debounce = setTimeout(() => void muat(), 200);
	}

	$effect(() => {
		void dateFrom;
		void dateTo;
		jadwalkanMuat();
		return () => clearTimeout(debounce);
	});

	function resetFilter() {
		dateFrom = '';
		dateTo = '';
	}

	async function unduh() {
		try {
			await unduhEksporChannelAnalytics(params());
			showToast('CSV channel analytics diunduh', 'sukses');
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal ekspor', 'bahaya');
		}
	}
</script>

<div class="space-y-6">
	<header class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="font-display text-2xl text-foreground">Channel Analytics</h1>
			<p class="text-sm text-muted-foreground">
				Penjualan approved per channel, territory, produk terlaris, dan tren harian.
			</p>
		</div>
		{#if bisaEkspor}
			<Button variant="outline" onclick={() => void unduh()}>Ekspor CSV</Button>
		{/if}
	</header>

	<FilterBar onreset={resetFilter}>
		<Field label="Dari" forId="ca-df">
			<Input id="ca-df" class="w-full" type="date" bind:value={dateFrom} />
		</Field>
		<Field label="Sampai" forId="ca-dt">
			<Input id="ca-dt" class="w-full" type="date" bind:value={dateTo} />
		</Field>
	</FilterBar>

	{#if loading}
		<Skeleton class="h-48 w-full" />
	{:else if !data || (data.per_channel.length === 0 && data.tren_harian.length === 0)}
		<EmptyState title="Tidak ada data" description="Belum ada transaksi approved pada periode ini." />
	{:else}
		<Card.Root class="gap-0 border border-primary/20 p-4 shadow-none ring-0">
			<Card.Header class="p-0 pb-3">
				<Card.Title class="text-sm font-semibold text-foreground">Penjualan per channel</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-2 p-0">
				<BarChart
					labels={data.per_channel.map((c) => c.channel_outlet)}
					values={data.per_channel.map((c) => c.total_penjualan)}
					captions={data.per_channel.map((c) => `${c.jumlah_transaksi} trx · ${c.jumlah_outlet} outlet`)}
					formatValue={formatRupiah}
					ariaLabel="Penjualan per channel"
				/>
			</Card.Content>
		</Card.Root>

		<Card.Root class="gap-0 border border-primary/20 p-4 shadow-none ring-0">
			<Card.Header class="p-0 pb-3">
				<Card.Title class="text-sm font-semibold text-foreground">Tren harian</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3 p-0">
				<LineChart
					labels={data.tren_harian.map((t) => t.tanggal)}
					values={data.tren_harian.map((t) => t.total_penjualan)}
					ariaLabel="Tren penjualan harian"
				/>
				{#if data.tren_harian.length > 0}
					<div
						class="overflow-hidden rounded-[var(--radius-card)] border border-primary/20 bg-white"
					>
						<Table.Root>
							<Table.Header>
								<Table.Row class="hover:bg-transparent">
									<Table.Head class="px-3 py-2">Tanggal</Table.Head>
									<Table.Head class="px-3 py-2 text-right">Trx</Table.Head>
									<Table.Head class="px-3 py-2 text-right">Penjualan</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each data.tren_harian as t (t.tanggal)}
									<Table.Row>
										<Table.Cell class="px-3 py-2 tabular-nums">{t.tanggal}</Table.Cell>
										<Table.Cell class="px-3 py-2 text-right tabular-nums"
											>{t.jumlah_transaksi}</Table.Cell
										>
										<Table.Cell class="px-3 py-2 text-right tabular-nums"
											>{formatRupiah(t.total_penjualan)}</Table.Cell
										>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root class="gap-0 border border-primary/20 p-4 shadow-none ring-0">
			<Card.Header class="p-0 pb-3">
				<Card.Title class="text-sm font-semibold text-foreground">Per territory</Card.Title>
			</Card.Header>
			<Card.Content class="p-0">
				<div class="overflow-hidden rounded-[var(--radius-card)] border border-primary/20 bg-white">
					<Table.Root>
						<Table.Header>
							<Table.Row class="hover:bg-transparent">
								<Table.Head class="px-3 py-2">Territory</Table.Head>
								<Table.Head class="px-3 py-2 text-right">Trx</Table.Head>
								<Table.Head class="px-3 py-2 text-right">Outlet</Table.Head>
								<Table.Head class="px-3 py-2 text-right">Qty</Table.Head>
								<Table.Head class="px-3 py-2 text-right">Penjualan</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each data.per_territory as t (t.territory)}
								<Table.Row>
									<Table.Cell class="px-3 py-2">{t.territory}</Table.Cell>
									<Table.Cell class="px-3 py-2 text-right tabular-nums"
										>{t.jumlah_transaksi}</Table.Cell
									>
									<Table.Cell class="px-3 py-2 text-right tabular-nums">{t.jumlah_outlet}</Table.Cell>
									<Table.Cell class="px-3 py-2 text-right tabular-nums">{t.total_qty}</Table.Cell>
									<Table.Cell class="px-3 py-2 text-right tabular-nums"
										>{formatRupiah(t.total_penjualan)}</Table.Cell
									>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root class="gap-0 border border-primary/20 p-4 shadow-none ring-0">
			<Card.Header class="p-0 pb-3">
				<Card.Title class="text-sm font-semibold text-foreground">Produk terlaris</Card.Title>
			</Card.Header>
			<Card.Content class="p-0">
				<div class="overflow-hidden rounded-[var(--radius-card)] border border-primary/20 bg-white">
					<Table.Root>
						<Table.Header>
							<Table.Row class="hover:bg-transparent">
								<Table.Head class="px-3 py-2">Kode</Table.Head>
								<Table.Head class="px-3 py-2">Nama</Table.Head>
								<Table.Head class="px-3 py-2 text-right">Qty</Table.Head>
								<Table.Head class="px-3 py-2 text-right">Keluar</Table.Head>
								<Table.Head class="px-3 py-2 text-right">Trx</Table.Head>
								<Table.Head class="px-3 py-2 text-right">After disc</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each data.produk_terlaris as p (p.kode_item)}
								<Table.Row>
									<Table.Cell class="px-3 py-2 font-mono text-xs">{p.kode_item}</Table.Cell>
									<Table.Cell class="px-3 py-2">{p.nama_item}</Table.Cell>
									<Table.Cell class="px-3 py-2 text-right tabular-nums">{p.total_qty}</Table.Cell>
									<Table.Cell class="px-3 py-2 text-right tabular-nums"
										>{p.total_qty_keluar}</Table.Cell
									>
									<Table.Cell class="px-3 py-2 text-right tabular-nums"
										>{p.jumlah_transaksi}</Table.Cell
									>
									<Table.Cell class="px-3 py-2 text-right tabular-nums"
										>{formatRupiah(p.total_after_disc)}</Table.Cell
									>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
