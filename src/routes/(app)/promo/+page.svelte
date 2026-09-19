<script lang="ts">
	import DataTable from '$lib/components/data/DataTable.svelte';
	import type { ColumnDef } from '$lib/components/data/column';
	import Pagination from '$lib/components/data/Pagination.svelte';
	import FilterBar from '$lib/components/data/FilterBar.svelte';
	import Field from '$lib/components/form/Field.svelte';
	import Combobox from '$lib/components/form/Combobox.svelte';
	import { TIPE_PROMO_OPTIONS, daftarPromo, type Promo } from '$lib/api/promo';
	import type { PageMeta } from '$lib/api/barang';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { pergiKe, resolveAppPath } from '$lib/nav';
	import { ApiError } from '$lib/api/http';

	type Row = Promo & Record<string, unknown>;

	let q = $state('');
	let tipe = $state('');
	let hanyaAktifPeriode = $state(false);
	let tampilNonaktif = $state(false);
	let page = $state(1);
	let rows = $state<Row[]>([]);
	let meta = $state<PageMeta>({ page: 1, per_page: 20, total: 0, total_pages: 1 });
	let loading = $state(true);
	let debounce: ReturnType<typeof setTimeout> | undefined;

	const bisaKelola = $derived(auth.punyaIzin('promo.kelola'));

	const tipeOpts = [
		{ value: '', label: 'Semua tipe' },
		...TIPE_PROMO_OPTIONS.map((o) => ({ value: o.value, label: o.label }))
	];

	const columns: ColumnDef<Row>[] = [
		{ id: 'kode', header: 'Kode', accessor: 'kode_promo' },
		{ id: 'nama', header: 'Nama', accessor: 'nama_promo' },
		{ id: 'tipe', header: 'Tipe', accessor: 'tipe_promo' },
		{
			id: 'periode',
			header: 'Periode',
			format: (r) => `${r.tanggal_mulai} → ${r.tanggal_berakhir}`
		},
		{ id: 'sku', header: 'SKU', format: (r) => r.kode_barang ?? 'Semua' },
		{ id: 'aktif', header: 'Aktif', format: (r) => (r.is_active ? 'Ya' : 'Tidak') }
	];

	async function muat() {
		loading = true;
		try {
			const res = await daftarPromo({
				q: q || undefined,
				tipe_promo: tipe || undefined,
				page,
				per_page: 20,
				aktif: hanyaAktifPeriode || undefined,
				include_inactive: !hanyaAktifPeriode && tampilNonaktif ? true : undefined,
				sort: 'tanggal_mulai'
			});
			rows = res.data as Row[];
			meta = res.meta;
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal memuat', 'bahaya');
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
		void tipe;
		void page;
		void hanyaAktifPeriode;
		void tampilNonaktif;
		jadwalkanMuat();
		return () => clearTimeout(debounce);
	});

	function resetFilter() {
		q = '';
		tipe = '';
		hanyaAktifPeriode = false;
		tampilNonaktif = false;
		page = 1;
	}
</script>

<div class="space-y-4">
	<header class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="font-display text-2xl text-ink">Promo</h1>
			<p class="text-sm text-muted">
				Master promo. Sales memakai filter aktif untuk form transaksi.
			</p>
		</div>
		{#if bisaKelola}
			<a
				href={resolveAppPath('/promo/baru')}
				class="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
			>
				Tambah promo
			</a>
		{/if}
	</header>

	<FilterBar onreset={resetFilter}>
		<Field label="Cari" forId="promo-q">
			<input
				id="promo-q"
				class="rounded-lg border border-slate-300 px-3 py-2 text-sm"
				placeholder="Kode / nama"
				bind:value={q}
				oninput={() => {
					page = 1;
				}}
			/>
		</Field>
		<Field label="Tipe" forId="promo-tipe">
			<Combobox
				id="promo-tipe"
				options={tipeOpts}
				bind:value={tipe}
				onchange={() => {
					page = 1;
				}}
			/>
		</Field>
		<label class="flex items-center gap-2 pb-2 text-sm text-ink">
			<input type="checkbox" bind:checked={hanyaAktifPeriode} onchange={() => (page = 1)} />
			Hanya aktif di periode hari ini
		</label>
		{#if !hanyaAktifPeriode}
			<label class="flex items-center gap-2 pb-2 text-sm text-ink">
				<input type="checkbox" bind:checked={tampilNonaktif} onchange={() => (page = 1)} />
				Sertakan nonaktif
			</label>
		{/if}
	</FilterBar>

	<DataTable
		{columns}
		{rows}
		{loading}
		rowKey={(r) => r.id}
		emptyTitle="Tidak ada promo"
		emptyDescription="Belum ada promo untuk filter ini."
		onrowclick={(r) => pergiKe(`/promo/${r.id}`)}
	/>

	{#if rows.length > 0}
		<Pagination
			page={meta.page}
			totalPages={meta.total_pages}
			total={meta.total}
			onpage={(p) => (page = p)}
		/>
	{/if}
</div>
