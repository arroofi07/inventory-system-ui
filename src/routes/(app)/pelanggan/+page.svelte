<script lang="ts">
	import DataTable from '$lib/components/data/DataTable.svelte';
	import type { ColumnDef } from '$lib/components/data/column';
	import Pagination from '$lib/components/data/Pagination.svelte';
	import FilterBar from '$lib/components/data/FilterBar.svelte';
	import Field from '$lib/components/form/Field.svelte';
	import Combobox from '$lib/components/form/Combobox.svelte';
	import AsyncCombobox from '$lib/components/form/AsyncCombobox.svelte';
	import {
		CHANNEL_OUTLET_OPTIONS,
		cariPelangganSelect2,
		daftarPelanggan,
		type Pelanggan
	} from '$lib/api/pelanggan';
	import type { PageMeta } from '$lib/api/barang';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { pergiKe, resolveAppPath } from '$lib/nav';
	import { ApiError, apiDownload } from '$lib/api/http';
	import ImporCSVModal from '$lib/components/data/ImporCSVModal.svelte';

	type Row = Pelanggan & Record<string, unknown>;

	let q = $state('');
	let channel = $state('');
	let tampilNonaktif = $state(false);
	let page = $state(1);
	let rows = $state<Row[]>([]);
	let meta = $state<PageMeta>({ page: 1, per_page: 20, total: 0, total_pages: 1 });
	let loading = $state(true);
	let debounce: ReturnType<typeof setTimeout> | undefined;
	let cariCepat = $state('');
	let imporOpen = $state(false);

	const bisaBuat = $derived(auth.punyaIzin('pelanggan.buat'));
	const bisaUbah = $derived(auth.punyaIzin('pelanggan.ubah'));
	const bisaEkspor = $derived(auth.punyaIzin('laporan.ekspor'));

	async function unduhTemplate() {
		try {
			await apiDownload('/pelanggan/template-impor', 'template-pelanggan.csv');
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal unduh template', 'bahaya');
		}
	}

	async function unduhEkspor() {
		try {
			const qs = new URLSearchParams();
			if (q) qs.set('q', q);
			if (channel) qs.set('channel_outlet', channel);
			if (tampilNonaktif) qs.set('include_inactive', 'true');
			const s = qs.toString();
			await apiDownload(`/pelanggan/export${s ? `?${s}` : ''}`, 'pelanggan.csv');
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal ekspor', 'bahaya');
		}
	}
	const channelOpts = [
		{ value: '', label: 'Semua channel' },
		...CHANNEL_OUTLET_OPTIONS.map((o) => ({ value: o.value, label: o.label }))
	];

	const columns: ColumnDef<Row>[] = [
		{ id: 'kode', header: 'Kode', accessor: 'kode_pelanggan' },
		{ id: 'nama', header: 'Nama', accessor: 'nama_pelanggan' },
		{ id: 'channel', header: 'Channel', accessor: 'channel_outlet' },
		{ id: 'wilayah', header: 'Wilayah', format: (r) => `${r.territory} / ${r.distrik}` },
		{ id: 'phone', header: 'Telepon', accessor: 'phone' },
		{ id: 'aktif', header: 'Aktif', format: (r) => (r.is_active ? 'Ya' : 'Tidak') }
	];

	async function muat() {
		loading = true;
		try {
			const res = await daftarPelanggan({
				q: q || undefined,
				channel_outlet: channel || undefined,
				page,
				per_page: 20,
				include_inactive: tampilNonaktif || undefined,
				sort: 'kode_pelanggan'
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
		void channel;
		void page;
		void tampilNonaktif;
		jadwalkanMuat();
		return () => clearTimeout(debounce);
	});

	function resetFilter() {
		q = '';
		channel = '';
		tampilNonaktif = false;
		page = 1;
	}
</script>

<div class="space-y-4">
	<header class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="font-display text-2xl text-ink">Pelanggan</h1>
			<p class="text-sm text-muted">Master outlet. Nonaktif tersembunyi dari pencarian transaksi.</p>
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
					href={resolveAppPath('/pelanggan/baru')}
					class="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
				>
					Tambah pelanggan
				</a>
			{/if}
		</div>
	</header>

	<section class="rounded-[var(--radius-card)] border border-slate-200 bg-white p-4">
		<p class="mb-2 text-xs uppercase text-muted">Cari cepat (Select2)</p>
		<AsyncCombobox
			bind:value={cariCepat}
			placeholder="Ketik kode atau nama…"
			onsearch={async (query) => {
				const res = await cariPelangganSelect2(query);
				return res.results.map((r) => ({ value: r.id, label: r.text }));
			}}
			onchange={(opt) => {
				if (opt) void pergiKe(`/pelanggan/${opt.value}`);
			}}
		/>
	</section>

	<FilterBar onreset={resetFilter}>
		<Field label="Cari" forId="plg-q">
			<input
				id="plg-q"
				class="rounded-lg border border-slate-300 px-3 py-2 text-sm"
				placeholder="Kode / nama / telepon"
				bind:value={q}
				oninput={() => {
					page = 1;
				}}
			/>
		</Field>
		<Field label="Channel" forId="plg-ch">
			<Combobox
				id="plg-ch"
				options={channelOpts}
				bind:value={channel}
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

	<DataTable
		{columns}
		{rows}
		{loading}
		rowKey={(r) => r.id}
		emptyTitle="Tidak ada pelanggan"
		emptyDescription="Belum ada outlet untuk filter ini."
		onrowclick={(r) => pergiKe(`/pelanggan/${r.id}`)}
	/>

	{#if rows.length > 0}
		<Pagination
			page={meta.page}
			totalPages={meta.total_pages}
			total={meta.total}
			onpage={(p) => (page = p)}
		/>
	{/if}

	{#if bisaUbah}
		<p class="text-xs text-muted">Ubah / nonaktifkan hanya Super Admin.</p>
	{/if}
</div>

<ImporCSVModal
	bind:open={imporOpen}
	endpoint="/pelanggan/impor"
	judul="Impor pelanggan"
	onsukses={() => void muat()}
/>
