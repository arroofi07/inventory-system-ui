<script lang="ts">
	import DataTable from '$lib/components/data/DataTable.svelte';
	import type { ColumnDef } from '$lib/components/data/column';
	import Pagination from '$lib/components/data/Pagination.svelte';
	import FilterBar from '$lib/components/data/FilterBar.svelte';
	import Field from '$lib/components/form/Field.svelte';
	import Combobox from '$lib/components/form/Combobox.svelte';
	import { daftarTransaksi, type TransaksiListItem } from '$lib/api/transaksi';
	import type { PageMeta } from '$lib/api/barang';
	import { formatRupiah } from '$lib/domain/format';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { pergiKe, resolveAppPath } from '$lib/nav';
	import { ApiError } from '$lib/api/http';

	type Row = TransaksiListItem & Record<string, unknown>;

	let q = $state('');
	let statusApproval = $state('');
	let statusBayar = $state('');
	let dateFrom = $state('');
	let dateTo = $state('');
	let page = $state(1);
	let rows = $state<Row[]>([]);
	let meta = $state<PageMeta>({ page: 1, per_page: 20, total: 0, total_pages: 1 });
	let loading = $state(true);
	let debounce: ReturnType<typeof setTimeout> | undefined;

	const bisaBuat = $derived(auth.punyaIzin('transaksi.buat'));

	const statusOpts = [
		{ value: '', label: 'Semua status' },
		{ value: 'pending', label: 'Pending' },
		{ value: 'approved', label: 'Approved' },
		{ value: 'rejected', label: 'Rejected' }
	];
	const bayarOpts = [
		{ value: '', label: 'Semua bayar' },
		{ value: 'lunas', label: 'Lunas' },
		{ value: 'hutang', label: 'Hutang' },
		{ value: 'sebagian', label: 'Sebagian' }
	];

	const columns: ColumnDef<Row>[] = [
		{
			id: 'no',
			header: 'No',
			format: (r) => r.no_transaksi ?? `#${r.id}`
		},
		{ id: 'tgl', header: 'Tanggal', accessor: 'tanggal' },
		{
			id: 'plg',
			header: 'Pelanggan',
			format: (r) => `${r.kode_pelanggan} — ${r.nama_pelanggan}`
		},
		{ id: 'approval', header: 'Approval', accessor: 'status_approval' },
		{ id: 'bayar', header: 'Bayar', accessor: 'status_pembayaran' },
		{
			id: 'total',
			header: 'Total akhir',
			format: (r) => formatRupiah(r.total_akhir)
		},
		{
			id: 'qty',
			header: 'Qty',
			format: (r) => `${r.total_qty_ditagih}/${r.total_qty_keluar}`,
			hideOnMobile: true
		},
		{ id: 'id', header: 'ID', accessor: 'id', hideOnMobile: true }
	];

	async function muat() {
		loading = true;
		try {
			const res = await daftarTransaksi({
				q: q || undefined,
				status_approval: statusApproval || undefined,
				status_pembayaran: statusBayar || undefined,
				date_from: dateFrom || undefined,
				date_to: dateTo || undefined,
				page,
				per_page: 20
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
		void statusApproval;
		void statusBayar;
		void dateFrom;
		void dateTo;
		void page;
		jadwalkanMuat();
		return () => clearTimeout(debounce);
	});

	function resetFilter() {
		q = '';
		statusApproval = '';
		statusBayar = '';
		dateFrom = '';
		dateTo = '';
		page = 1;
	}
</script>

<div class="space-y-4 {bisaBuat ? 'pb-20 md:pb-0' : ''}">
	<header class="hidden items-end justify-between gap-3 md:flex">
		<div>
			<h1 class="font-display text-2xl text-ink">Transaksi</h1>
			<p class="text-sm text-muted">
				Sales hanya melihat order sendiri. Tidak ada edit/hapus setelah dibuat.
			</p>
		</div>
		{#if bisaBuat}
			<a
				href={resolveAppPath('/transaksi/baru')}
				class="rounded bg-slate-900 px-4 py-2 text-sm text-white">Transaksi baru</a
			>
		{/if}
	</header>

	<p class="text-sm text-muted md:hidden">
		Sales hanya melihat order sendiri. Tidak ada edit/hapus setelah dibuat.
	</p>

	<FilterBar onreset={resetFilter}>
		<Field label="Cari" forId="q">
			<input
				id="q"
				class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
				placeholder="Kode/nama pelanggan, ID, no…"
				bind:value={q}
			/>
		</Field>
		<Field label="Status approval" forId="sa">
			<Combobox id="sa" options={statusOpts} bind:value={statusApproval} />
		</Field>
		<Field label="Status bayar" forId="sb">
			<Combobox id="sb" options={bayarOpts} bind:value={statusBayar} />
		</Field>
		<Field label="Dari tanggal" forId="df">
			<input id="df" type="date" class="w-full rounded-lg border px-3 py-2 text-sm" bind:value={dateFrom} />
		</Field>
		<Field label="Sampai" forId="dt">
			<input id="dt" type="date" class="w-full rounded-lg border px-3 py-2 text-sm" bind:value={dateTo} />
		</Field>
	</FilterBar>

	<DataTable
		{columns}
		{rows}
		{loading}
		emptyTitle="Belum ada transaksi"
		onrowclick={(r) => void pergiKe(`/transaksi/${r.id}`)}
	/>
	<Pagination
		page={meta.page}
		totalPages={meta.total_pages}
		total={meta.total}
		onpage={(p) => (page = p)}
	/>

	{#if bisaBuat}
		<div
			class="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden"
		>
			<a
				href={resolveAppPath('/transaksi/baru')}
				class="flex min-h-11 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white"
			>
				Transaksi baru
			</a>
		</div>
	{/if}
</div>
