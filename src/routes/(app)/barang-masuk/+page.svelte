<script lang="ts">
	import DataTable from '$lib/components/data/DataTable.svelte';
	import type { ColumnDef } from '$lib/components/data/column';
	import Pagination from '$lib/components/data/Pagination.svelte';
	import FilterBar from '$lib/components/data/FilterBar.svelte';
	import Field from '$lib/components/form/Field.svelte';
	import { daftarBarangMasuk, type BarangMasuk } from '$lib/api/barang-masuk';
	import type { PageMeta } from '$lib/api/barang';
	import { ApiError, apiDownload } from '$lib/api/http';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { pergiKe, resolveAppPath } from '$lib/nav';
	import { formatRupiah } from '$lib/domain/format';
	import ImporCSVModal from '$lib/components/data/ImporCSVModal.svelte';

	type Row = BarangMasuk & Record<string, unknown>;

	let q = $state('');
	let page = $state(1);
	let rows = $state<Row[]>([]);
	let meta = $state<PageMeta>({ page: 1, per_page: 20, total: 0, total_pages: 1 });
	let loading = $state(true);
	let debounce: ReturnType<typeof setTimeout> | undefined;
	let imporOpen = $state(false);

	const bisaBuat = $derived(auth.punyaIzin('barang_masuk.buat'));
	const bisaEkspor = $derived(auth.punyaIzin('laporan.ekspor'));

	async function unduhTemplate() {
		try {
			await apiDownload('/barang-masuk/template-impor', 'template-barang-masuk.csv');
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal unduh template', 'bahaya');
		}
	}

	async function unduhEkspor() {
		try {
			const qs = q ? `?q=${encodeURIComponent(q)}` : '';
			await apiDownload(`/barang-masuk/export${qs}`, 'barang-masuk.csv');
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal ekspor', 'bahaya');
		}
	}
	const columns: ColumnDef<Row>[] = [
		{ id: 'tgl', header: 'Tanggal', accessor: 'tanggal_masuk' },
		{ id: 'kode', header: 'Kode', accessor: 'kode_barang' },
		{ id: 'nama', header: 'Nama', accessor: 'nama_item' },
		{ id: 'batch', header: 'Batch', accessor: 'no_batch' },
		{ id: 'faktur', header: 'Faktur', accessor: 'no_faktur' },
		{ id: 'qty', header: 'Qty', align: 'right', format: (r) => String(r.qty) },
		{
			id: 'hpp',
			header: 'HPP',
			align: 'right',
			format: (r) => formatRupiah(r.hpp, { tanpaSimbol: true })
		},
		{
			id: 'mt',
			header: 'Harga MT',
			align: 'right',
			format: (r) => formatRupiah(r.harga_mt, { tanpaSimbol: true })
		}
	];

	async function muat() {
		loading = true;
		try {
			const res = await daftarBarangMasuk({ q: q || undefined, page, per_page: 20 });
			rows = res.data as Row[];
			meta = res.meta;
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal memuat', 'bahaya');
			rows = [];
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		void q;
		void page;
		clearTimeout(debounce);
		debounce = setTimeout(() => void muat(), 200);
		return () => clearTimeout(debounce);
	});
</script>

<div class="space-y-4">
	<header class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="font-display text-2xl text-ink">Barang masuk</h1>
			<p class="text-sm text-muted">
				Penerimaan batch. HPP dan harga jual dihitung server saat simpan.
			</p>
		</div>
		<div class="flex flex-wrap gap-2">
			{#if bisaEkspor}
				<button
					type="button"
					class="rounded-lg border border-slate-300 px-3 py-2 text-sm"
					onclick={() => void unduhEkspor()}
				>
					Ekspor CSV
				</button>
			{/if}
			{#if bisaBuat}
				<button
					type="button"
					class="rounded-lg border border-slate-300 px-3 py-2 text-sm"
					onclick={() => void unduhTemplate()}
				>
					Template impor
				</button>
				<button
					type="button"
					class="rounded-lg border border-slate-300 px-3 py-2 text-sm"
					onclick={() => (imporOpen = true)}
				>
					Impor CSV
				</button>
				<a
					href={resolveAppPath('/barang-masuk/baru')}
					class="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
				>
					Tambah stok
				</a>
			{/if}
		</div>
	</header>

	<FilterBar
		onreset={() => {
			q = '';
			page = 1;
		}}
	>
		<Field label="Cari" forId="bm-q">
			<input
				id="bm-q"
				class="rounded-lg border border-slate-300 px-3 py-2 text-sm"
				placeholder="Kode / nama / batch / faktur"
				bind:value={q}
				oninput={() => (page = 1)}
			/>
		</Field>
	</FilterBar>

	<DataTable
		{columns}
		{rows}
		{loading}
		rowKey={(r) => r.id}
		emptyTitle="Belum ada penerimaan"
		emptyDescription="Catat barang masuk untuk menambah stok batch."
		onrowclick={(r) => pergiKe(`/barang-masuk/${r.id}`)}
	/>

	<Pagination
		page={meta.page}
		perPage={meta.per_page}
		total={meta.total}
		totalPages={meta.total_pages}
		onpage={(p) => (page = p)}
	/>
</div>

<ImporCSVModal
	bind:open={imporOpen}
	endpoint="/barang-masuk/impor"
	judul="Impor barang masuk"
	onsukses={() => void muat()}
/>
