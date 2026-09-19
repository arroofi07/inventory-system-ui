<script lang="ts">
	import DataTable from '$lib/components/data/DataTable.svelte';
	import type { ColumnDef } from '$lib/components/data/column';
	import Pagination from '$lib/components/data/Pagination.svelte';
	import FilterBar from '$lib/components/data/FilterBar.svelte';
	import Badge from '$lib/components/data/Badge.svelte';
	import StatCard from '$lib/components/data/StatCard.svelte';
	import Field from '$lib/components/form/Field.svelte';
	import Combobox from '$lib/components/form/Combobox.svelte';
	import {
		daftarBarang,
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
		{ id: 'kode', header: 'Kode', accessor: 'kode_barang' },
		{ id: 'nama', header: 'Nama', accessor: 'nama_item' },
		{ id: 'brand', header: 'Brand', accessor: 'brand' },
		{ id: 'stok', header: 'Stok', align: 'right', format: (r) => String(r.stok_tersedia) },
		{ id: 'status', header: 'Status stok', format: (r) => r.status_stok },
		{ id: 'aktif', header: 'Aktif', format: (r) => (r.is_active ? 'Ya' : 'Tidak') }
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
</script>

<div class="space-y-4">
	<header class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="font-display text-2xl text-ink">Master Barang</h1>
			<p class="text-sm text-muted">
				Katalog SKU. Stok dari saldo ledger resmi (<code class="font-mono text-xs"
					>stok_tersedia</code
				>).
			</p>
		</div>
		{#if bisaKelola}
			<a
				href={resolveAppPath('/barang/baru')}
				class="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
			>
				Tambah barang
			</a>
		{/if}
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
			<input
				id="barang-q"
				class="rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
		<label class="flex items-center gap-2 pb-2 text-sm text-ink">
			<input type="checkbox" bind:checked={tampilNonaktif} onchange={() => (page = 1)} />
			Sertakan nonaktif
		</label>
	</FilterBar>

	{#if rows.length > 0}
		<div class="flex flex-wrap gap-2">
			{#each rows.slice(0, 8) as r (r.id)}
				<Badge status={r.status_stok} label="{r.kode_barang}: {r.status_stok}" />
			{/each}
		</div>
	{/if}

	<DataTable
		{columns}
		{rows}
		{loading}
		rowKey={(r) => r.id}
		emptyTitle="Tidak ada barang"
		emptyDescription="Belum ada SKU untuk filter ini."
		onrowclick={(r) => pergiKe(`/barang/${r.id}`)}
	/>

	{#if rows.length > 0 && (bisaKelola || bisaTambahStok)}
		<div class="overflow-hidden rounded-[var(--radius-card)] border border-slate-200 bg-white">
			<table class="min-w-full text-sm">
				<thead class="bg-surface text-xs font-semibold uppercase text-muted">
					<tr>
						<th class="px-3 py-2 text-left">Aksi cepat</th>
						<th class="px-3 py-2 text-left">SKU</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each rows as r (r.id)}
						<tr>
							<td class="px-3 py-2">
								<div class="flex flex-wrap gap-2">
									<a class="text-brand-700 underline" href={resolveAppPath(`/barang/${r.id}`)}
										>Detail</a
									>
									{#if bisaTambahStok && r.is_active}
										<a
											class="text-brand-700 underline"
											href={resolveAppPath(pathTambahStok(r.kode_barang))}
										>
											Tambah stok
										</a>
									{/if}
									{#if bisaKelola}
										<a
											class="text-brand-700 underline"
											href={resolveAppPath(`/barang/${r.id}/ubah`)}>Ubah</a
										>
									{/if}
								</div>
							</td>
							<td class="px-3 py-2 font-mono text-xs">{r.kode_barang}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

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
