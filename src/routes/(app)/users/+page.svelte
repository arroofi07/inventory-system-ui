<script lang="ts">
	import DataTable from '$lib/components/data/DataTable.svelte';
	import type { ColumnDef } from '$lib/components/data/column';
	import Pagination from '$lib/components/data/Pagination.svelte';
	import FilterBar from '$lib/components/data/FilterBar.svelte';
	import Field from '$lib/components/form/Field.svelte';
	import Combobox from '$lib/components/form/Combobox.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { daftarUsers, type User } from '$lib/api/users';
	import type { PageMeta } from '$lib/api/barang';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { pergiKe, resolveAppPath } from '$lib/nav';
	import { ApiError } from '$lib/api/http';

	type Row = User & Record<string, unknown>;

	let q = $state('');
	let role = $state('');
	let tampilNonaktif = $state(false);
	let page = $state(1);
	let rows = $state<Row[]>([]);
	let meta = $state<PageMeta>({ page: 1, per_page: 20, total: 0, total_pages: 1 });
	let loading = $state(true);
	let debounce: ReturnType<typeof setTimeout> | undefined;

	const bisaKelola = $derived(auth.punyaIzin('user.kelola'));

	const roleOpts = [
		{ value: '', label: 'Semua role' },
		{ value: 'sales', label: 'Sales' },
		{ value: 'afiliasi', label: 'Afiliasi' },
		{ value: 'admin', label: 'Admin' },
		{ value: 'super_admin', label: 'Super Admin' }
	];

	const columns: ColumnDef<Row>[] = [
		{ id: 'name', header: 'Nama', accessor: 'name' },
		{ id: 'email', header: 'Email', accessor: 'email' },
		{ id: 'role', header: 'Role', accessor: 'role' },
		{ id: 'hp', header: 'HP', format: (r) => r.no_hp ?? '—' },
		{ id: 'aktif', header: 'Aktif', format: (r) => (r.is_active ? 'Ya' : 'Tidak') }
	];

	async function muat() {
		loading = true;
		try {
			const res = await daftarUsers({
				q: q || undefined,
				role: role || undefined,
				page,
				per_page: 20,
				include_inactive: tampilNonaktif || undefined,
				sort: 'name'
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
		void role;
		void page;
		void tampilNonaktif;
		jadwalkanMuat();
		return () => clearTimeout(debounce);
	});

	function resetFilter() {
		q = '';
		role = '';
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
			<h1 class="font-display text-2xl text-ink">Pengguna</h1>
			<p class="text-sm text-muted">
				Kelola akun. Form hanya role sales/afiliasi. Filter <code class="font-mono text-xs"
					>role=sales</code
				> untuk laporan.
			</p>
		</div>
		{#if bisaKelola}
			<Button href={resolveAppPath('/users/baru')}>Tambah pengguna</Button>
		{/if}
	</header>

	<FilterBar onreset={resetFilter}>
		<Field label="Cari" forId="user-q">
			<Input
				id="user-q"
				placeholder="Nama / email / HP"
				bind:value={q}
				oninput={() => {
					page = 1;
				}}
			/>
		</Field>
		<Field label="Role" forId="user-role">
			<Combobox
				id="user-role"
				options={roleOpts}
				bind:value={role}
				onchange={() => {
					page = 1;
				}}
			/>
		</Field>
		<label class="flex items-center gap-2 pb-2 text-sm text-ink">
			<Checkbox checked={tampilNonaktif} onCheckedChange={onTampilNonaktifChange} />
			Sertakan nonaktif
		</label>
	</FilterBar>

	<DataTable
		{columns}
		{rows}
		{loading}
		rowKey={(r) => r.id}
		emptyTitle="Tidak ada pengguna"
		emptyDescription="Belum ada akun untuk filter ini."
		onrowclick={(r) => pergiKe(`/users/${r.id}`)}
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
