<script lang="ts">
	import FilterBar from '$lib/components/data/FilterBar.svelte';
	import Field from '$lib/components/form/Field.svelte';
	import Skeleton from '$lib/components/feedback/Skeleton.svelte';
	import EmptyState from '$lib/components/data/EmptyState.svelte';
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

	const maxChannel = $derived(
		data ? Math.max(1, ...data.per_channel.map((c) => Number(c.total_penjualan) || 0)) : 1
	);
	const maxTren = $derived(
		data ? Math.max(1, ...data.tren_harian.map((t) => Number(t.total_penjualan) || 0)) : 1
	);

	function barWidth(nilai: string, max: number): string {
		const n = Number(nilai) || 0;
		return `${Math.max(2, Math.round((n / max) * 100))}%`;
	}

	function linePoints(rows: { total_penjualan: string }[], max: number): string {
		if (rows.length === 0) return '';
		const w = 100;
		const h = 40;
		return rows
			.map((r, i) => {
				const x = rows.length === 1 ? w / 2 : (i / (rows.length - 1)) * w;
				const y = h - (Math.min(1, (Number(r.total_penjualan) || 0) / max) * (h - 4) + 2);
				return `${x.toFixed(1)},${y.toFixed(1)}`;
			})
			.join(' ');
	}
</script>

<div class="space-y-6">
	<header class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="font-display text-2xl text-ink">Channel Analytics</h1>
			<p class="text-sm text-muted">
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
				<Card.Title class="text-sm font-semibold text-ink">Penjualan per channel</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-2 p-0">
				{#each data.per_channel as c (c.channel_outlet)}
					<div>
						<div class="mb-1 flex justify-between text-sm">
							<span>{c.channel_outlet}</span>
							<span class="tabular-nums text-muted">
								{formatRupiah(c.total_penjualan)} · {c.jumlah_transaksi} trx · {c.jumlah_outlet} outlet
							</span>
						</div>
						<div class="h-2 overflow-hidden rounded bg-primary/10">
							<div
								class="h-full rounded bg-brand-600 transition-[width] duration-500"
								style="width: {barWidth(c.total_penjualan, maxChannel)}"
							></div>
						</div>
					</div>
				{/each}
			</Card.Content>
		</Card.Root>

		<Card.Root class="gap-0 border border-primary/20 p-4 shadow-none ring-0">
			<Card.Header class="p-0 pb-3">
				<Card.Title class="text-sm font-semibold text-ink">Tren harian</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3 p-0">
				{#if data.tren_harian.length === 0}
					<p class="text-sm text-muted">Tidak ada tren.</p>
				{:else}
					<svg
						viewBox="0 0 100 40"
						class="h-28 w-full overflow-visible rounded border border-primary/20 bg-white p-2"
						role="img"
						aria-label="Tren penjualan harian"
					>
						<polyline
							fill="none"
							stroke="currentColor"
							stroke-width="0.8"
							class="text-brand-700"
							points={linePoints(data.tren_harian, maxTren)}
						/>
					</svg>
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
				<Card.Title class="text-sm font-semibold text-ink">Per territory</Card.Title>
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
				<Card.Title class="text-sm font-semibold text-ink">Produk terlaris</Card.Title>
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
