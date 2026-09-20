<script lang="ts">
	import { page } from '$app/state';
	import DataTable from '$lib/components/data/DataTable.svelte';
	import type { ColumnDef } from '$lib/components/data/column';
	import Pagination from '$lib/components/data/Pagination.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { detailBarang, type PageMeta } from '$lib/api/barang';
	import { riwayatHarga, type PriceChangeLog } from '$lib/api/harga';
	import { ApiError } from '$lib/api/http';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { pergiKe, resolveAppPath } from '$lib/nav';
	import { formatRupiah } from '$lib/domain/format';
	import { onMount } from 'svelte';

	type Row = PriceChangeLog & Record<string, unknown>;

	const id = $derived(Number(page.params.id));
	let judul = $state('');
	let pageNo = $state(1);
	let rows = $state<Row[]>([]);
	let meta = $state<PageMeta>({ page: 1, per_page: 20, total: 0, total_pages: 1 });
	let loading = $state(true);

	const columns: ColumnDef<Row>[] = [
		{ id: 'tgl', header: 'Waktu', accessor: 'changed_at' },
		{ id: 'batch', header: 'Batch', accessor: 'no_batch' },
		{
			id: 'mt',
			header: 'MT lama → baru',
			format: (r) =>
				`${formatRupiah(r.old_harga_mt ?? '0', { tanpaSimbol: true })} → ${formatRupiah(r.new_harga_mt ?? '0', { tanpaSimbol: true })}`
		},
		{
			id: 'hpp',
			header: 'HPP',
			format: (r) =>
				`${formatRupiah(r.old_hpp ?? '0', { tanpaSimbol: true })} → ${formatRupiah(r.new_hpp ?? '0', { tanpaSimbol: true })}`
		},
		{
			id: 'bulk',
			header: 'Bulk',
			format: (r) => String(r.bulk_operation_id).slice(0, 8) + '…'
		}
	];

	onMount(() => {
		if (!auth.punyaIzin('harga.kelola')) {
			showToast('Tidak berwenang melihat riwayat harga', 'bahaya');
			void pergiKe(`/barang/${id}`);
		}
	});

	$effect(() => {
		const barangId = id;
		void pageNo;
		if (!Number.isFinite(barangId) || barangId <= 0) return;
		loading = true;
		void detailBarang(barangId)
			.then((d) => {
				judul = `${d.data.kode_barang} — ${d.data.nama_item}`;
			})
			.catch(() => {
				judul = '';
			});
		void riwayatHarga(barangId, { page: pageNo, per_page: 20 })
			.then((res) => {
				rows = res.data as Row[];
				meta = res.meta;
			})
			.catch((e) => {
				showToast(e instanceof ApiError ? e.body.message : 'Gagal memuat', 'bahaya');
				rows = [];
			})
			.finally(() => {
				loading = false;
			});
	});
</script>

<div class="space-y-4">
	<Button variant="link" class="h-auto p-0" href={resolveAppPath(`/barang/${id}`)}>
		← Kembali ke detail
	</Button>
	<header class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="font-display text-2xl text-ink">Riwayat harga</h1>
			<p class="text-sm text-muted">{judul || '…'}</p>
		</div>
		{#if auth.punyaIzin('harga.kelola')}
			<Button href={resolveAppPath(`/barang/${id}/harga-massal`)}>Harga massal</Button>
		{/if}
	</header>

	<DataTable
		{columns}
		{rows}
		{loading}
		rowKey={(r) => r.id}
		emptyTitle="Belum ada perubahan harga"
		emptyDescription="Bulk update akan muncul di sini."
	/>

	<Pagination
		page={meta.page}
		perPage={meta.per_page}
		total={meta.total}
		totalPages={meta.total_pages}
		onpage={(p) => (pageNo = p)}
	/>
</div>
