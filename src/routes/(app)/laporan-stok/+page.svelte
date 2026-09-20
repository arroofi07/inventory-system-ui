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
		daftarLaporanStok,
		unduhEksporStok,
		type BarisLaporanStok,
		type LaporanStokRingkasan
	} from '$lib/api/laporan';
	import type { PageMeta } from '$lib/api/barang';
	import { formatRupiah } from '$lib/domain/format';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { ApiError } from '$lib/api/http';

	let q = $state('');
	let brand = $state('');
	let statusStok = $state('');
	let page = $state(1);
	let rows = $state<BarisLaporanStok[]>([]);
	let meta = $state<PageMeta>({ page: 1, per_page: 20, total: 0, total_pages: 1 });
	let ringkasan = $state<LaporanStokRingkasan>({ normal: 0, rendah: 0, habis: 0 });
	let loading = $state(true);
	let debounce: ReturnType<typeof setTimeout> | undefined;

	const bisaEkspor = $derived(auth.punyaIzin('laporan.ekspor'));

	const statusOpts = [
		{ value: '', label: 'Semua status' },
		{ value: 'NORMAL', label: 'Normal' },
		{ value: 'RENDAH', label: 'Rendah' },
		{ value: 'HABIS', label: 'Habis' }
	];

	function params() {
		return {
			q: q || undefined,
			brand: brand || undefined,
			status_stok: statusStok || undefined,
			page,
			per_page: 20
		};
	}

	async function muat() {
		loading = true;
		try {
			const res = await daftarLaporanStok(params());
			rows = res.data;
			meta = res.meta;
			ringkasan = res.ringkasan;
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal memuat laporan stok', 'bahaya');
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
		void statusStok;
		void page;
		jadwalkanMuat();
		return () => clearTimeout(debounce);
	});

	function resetFilter() {
		q = '';
		brand = '';
		statusStok = '';
		page = 1;
	}

	function badgeStatus(s: string): { text: string; className: string } {
		switch (s) {
			case 'HABIS':
				return { text: 'Habis', className: 'bg-red-100 text-red-800' };
			case 'RENDAH':
				return { text: 'Rendah', className: 'bg-amber-100 text-amber-900' };
			case 'NORMAL':
				return { text: 'Normal', className: 'bg-emerald-100 text-emerald-800' };
			default:
				return { text: s || '—', className: 'bg-primary/10 text-muted-foreground' };
		}
	}

	async function unduh() {
		try {
			await unduhEksporStok(params());
			showToast('CSV stok diunduh', 'sukses');
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal ekspor', 'bahaya');
		}
	}
</script>

<div class="space-y-4">
	<header class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="font-display text-2xl text-ink">Laporan Stok</h1>
			<p class="text-sm text-muted">Status Normal / Rendah / Habis per SKU aktif.</p>
		</div>
		{#if bisaEkspor}
			<Button variant="outline" onclick={() => void unduh()}>Ekspor CSV</Button>
		{/if}
	</header>

	<div class="grid gap-3 sm:grid-cols-3">
		<StatCard label="Normal" value={String(ringkasan.normal)} tone="sukses" />
		<StatCard label="Rendah" value={String(ringkasan.rendah)} tone="peringatan" />
		<StatCard label="Habis" value={String(ringkasan.habis)} tone="bahaya" />
	</div>

	<FilterBar onreset={resetFilter}>
		<Field label="Cari" forId="ls-q">
			<Input id="ls-q" class="w-full" bind:value={q} placeholder="Kode / nama / brand" />
		</Field>
		<Field label="Brand" forId="ls-br">
			<Input id="ls-br" class="w-full" bind:value={brand} placeholder="Brand" />
		</Field>
		<Field label="Status stok" forId="ls-st">
			<Combobox id="ls-st" options={statusOpts} bind:value={statusStok} />
		</Field>
	</FilterBar>

	{#if loading}
		<Skeleton class="h-48 w-full" />
	{:else if rows.length === 0}
		<EmptyState title="Tidak ada data" description="Ubah filter atau pastikan ada barang aktif." />
	{:else}
		<div class="overflow-hidden rounded-[var(--radius-card)] border border-primary/20 bg-white">
			<Table.Root>
				<Table.Header>
					<Table.Row class="hover:bg-transparent">
						<Table.Head class="px-3 py-2">Kode</Table.Head>
						<Table.Head class="px-3 py-2">Nama</Table.Head>
						<Table.Head class="px-3 py-2">Brand</Table.Head>
						<Table.Head class="px-3 py-2 text-right">Stok</Table.Head>
						<Table.Head class="px-3 py-2 text-right">Min</Table.Head>
						<Table.Head class="px-3 py-2">Status</Table.Head>
						<Table.Head class="px-3 py-2 text-right">Batch</Table.Head>
						<Table.Head class="px-3 py-2">Exp terdekat</Table.Head>
						<Table.Head class="px-3 py-2 text-right">Nilai HPP</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each rows as row (row.kode_barang)}
						{@const badge = badgeStatus(row.status_stok)}
						<Table.Row>
							<Table.Cell class="px-3 py-2 font-mono text-xs">{row.kode_barang}</Table.Cell>
							<Table.Cell class="px-3 py-2">{row.nama_item}</Table.Cell>
							<Table.Cell class="px-3 py-2">{row.brand}</Table.Cell>
							<Table.Cell class="px-3 py-2 text-right tabular-nums">{row.stok_tersedia}</Table.Cell>
							<Table.Cell class="px-3 py-2 text-right tabular-nums">{row.min_stock}</Table.Cell>
							<Table.Cell class="px-3 py-2">
								<span class="rounded px-1.5 py-0.5 text-xs {badge.className}">{badge.text}</span>
							</Table.Cell>
							<Table.Cell class="px-3 py-2 text-right tabular-nums">{row.jumlah_batch}</Table.Cell>
							<Table.Cell class="px-3 py-2 tabular-nums">{row.batch_terdekat_exp ?? '—'}</Table.Cell>
							<Table.Cell class="px-3 py-2 text-right tabular-nums"
								>{formatRupiah(row.nilai_stok_hpp)}</Table.Cell
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
