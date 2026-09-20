<script lang="ts">
	import DataTable from '$lib/components/data/DataTable.svelte';
	import type { ColumnDef } from '$lib/components/data/column';
	import Pagination from '$lib/components/data/Pagination.svelte';
	import FilterBar from '$lib/components/data/FilterBar.svelte';
	import StatCard from '$lib/components/data/StatCard.svelte';
	import Field from '$lib/components/form/Field.svelte';
	import Combobox from '$lib/components/form/Combobox.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import {
		daftarBarang,
		pathTambahBarang,
		pathTambahStok,
		type Barang,
		type PageMeta,
		type StatusStok
	} from '$lib/api/barang';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { pergiKe, resolveAppPath } from '$lib/nav';
	import { ApiError } from '$lib/api/http';

	type Row = Barang & Record<string, unknown>;

	let q = $state('');
	let statusStok = $state('');
	let tampilNonaktif = $state(false);
	let page = $state(1);
	let rows = $state<Row[]>([]);
	let meta = $state<PageMeta>({ page: 1, per_page: 20, total: 0, total_pages: 1 });
	let loading = $state(true);
	let ringkas = $state({ total: 0, rendah: 0, habis: 0 });
	let debounce: ReturnType<typeof setTimeout> | undefined;

	const bisaKelola = $derived(auth.punyaIzin('barang.kelola'));
	const bisaTambahStok = $derived(auth.punyaIzin('barang_masuk.buat'));

	const columns: ColumnDef<Row>[] = [
		{ id: 'kode', header: 'Kode', accessor: 'kode_barang', mono: true },
		{ id: 'nama', header: 'Nama', accessor: 'nama_item' },
		{ id: 'brand', header: 'Brand', accessor: 'brand' },
		{ id: 'stok', header: 'Stok', align: 'right', format: (r) => String(r.stok_tersedia) },
		{
			id: 'status',
			header: 'Status stok',
			badge: (r) => ({ label: r.status_stok, status: r.status_stok })
		},
		{
			id: 'aktif',
			header: 'Aktif',
			badge: (r) => ({
				label: r.is_active ? 'Aktif' : 'Nonaktif',
				tone: r.is_active ? 'sukses' : 'netral'
			})
		}
	];

	async function muatRingkas() {
		try {
			const [semua, rendah, habis] = await Promise.all([
				daftarBarang({ page: 1, per_page: 1 }),
				daftarBarang({ page: 1, per_page: 1, status_stok: 'RENDAH' }),
				daftarBarang({ page: 1, per_page: 1, status_stok: 'HABIS' })
			]);
			ringkas = {
				total: semua.meta.total,
				rendah: rendah.meta.total,
				habis: habis.meta.total
			};
		} catch {
			/* ringkasan opsional */
		}
	}

	async function muat() {
		loading = true;
		try {
			const res = await daftarBarang({
				q: q || undefined,
				status_stok: (statusStok as StatusStok) || undefined,
				page,
				per_page: 20,
				include_inactive: tampilNonaktif || undefined,
				sort: 'kode_barang'
			});
			rows = res.data as Row[];
			meta = res.meta;
		} catch (e) {
			const msg =
				e instanceof ApiError ? e.body.message : e instanceof Error ? e.message : 'Gagal memuat';
			showToast(msg, 'bahaya');
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
		void statusStok;
		void page;
		void tampilNonaktif;
		jadwalkanMuat();
		return () => clearTimeout(debounce);
	});

	$effect(() => {
		void muatRingkas();
	});

	function resetFilter() {
		q = '';
		statusStok = '';
		tampilNonaktif = false;
		page = 1;
	}

	function onTampilNonaktifChange(v: boolean | 'indeterminate') {
		tampilNonaktif = v === true;
		page = 1;
	}
</script>

<div class="space-y-4">
	<header class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="text-foreground font-display text-2xl tracking-tight">Master Barang</h1>
			<p class="text-muted-foreground text-sm">
				Katalog SKU. Stok dari saldo ledger resmi (<code class="font-mono text-xs"
					>stok_tersedia</code
				>).
			</p>
		</div>
		<div class="flex flex-wrap items-center gap-2">
			{#if bisaTambahStok}
				<Button href={resolveAppPath(pathTambahBarang())}>Tambah barang</Button>
			{:else if bisaKelola}
				<Button href={resolveAppPath('/barang/baru')}>Tambah barang</Button>
			{/if}
		</div>
	</header>

	<div class="grid gap-3 sm:grid-cols-3">
		<StatCard label="SKU aktif" value={String(ringkas.total)} hint="Default list tanpa nonaktif" />
		<StatCard
			label="Stok rendah"
			value={String(ringkas.rendah)}
			tone="peringatan"
			hint="≤ min_stock"
		/>
		<StatCard label="Stok habis" value={String(ringkas.habis)} tone="bahaya" hint="stok ≤ 0" />
	</div>

	<FilterBar onreset={resetFilter}>
		<Field label="Cari" forId="barang-q">
			<Input
				id="barang-q"
				placeholder="Kode / nama / brand"
				bind:value={q}
				oninput={() => {
					page = 1;
				}}
			/>
		</Field>
		<Field label="Status stok" forId="barang-status">
			<Combobox
				id="barang-status"
				options={[
					{ value: '', label: 'Semua' },
					{ value: 'NORMAL', label: 'Normal' },
					{ value: 'RENDAH', label: 'Rendah' },
					{ value: 'HABIS', label: 'Habis' }
				]}
				bind:value={statusStok}
				onchange={() => {
					page = 1;
				}}
			/>
		</Field>
		<label class="text-foreground flex items-center gap-2 pb-2 text-sm">
			<Checkbox checked={tampilNonaktif} onCheckedChange={onTampilNonaktifChange} />
			Sertakan nonaktif
		</label>
	</FilterBar>

	<DataTable
		{columns}
		{rows}
		{loading}
		rowKey={(r) => r.id}
		emptyTitle="Tidak ada barang"
		emptyDescription="Belum ada SKU untuk filter ini."
		onrowclick={(r) => pergiKe(`/barang/${r.id}`)}
	>
		{#snippet actions(r)}
			{#if bisaKelola || bisaTambahStok}
				<Button variant="ghost" size="sm" href={resolveAppPath(`/barang/${r.id}`)}>Detail</Button>
				{#if bisaTambahStok && r.is_active}
					<Button variant="ghost" size="sm" href={resolveAppPath(pathTambahStok(r.kode_barang))}>
						Tambah stok
					</Button>
				{/if}
				{#if bisaKelola}
					<Button variant="outline" size="sm" href={resolveAppPath(`/barang/${r.id}/ubah`)}>
						Ubah
					</Button>
				{/if}
			{/if}
		{/snippet}
	</DataTable>

	<Pagination
		page={meta.page}
		perPage={meta.per_page}
		total={meta.total}
		totalPages={meta.total_pages}
		onpage={(p) => {
			page = p;
		}}
	/>
</div>
