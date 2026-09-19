<script lang="ts">
	import Pagination from '$lib/components/data/Pagination.svelte';
	import FilterBar from '$lib/components/data/FilterBar.svelte';
	import Field from '$lib/components/form/Field.svelte';
	import Combobox from '$lib/components/form/Combobox.svelte';
	import Skeleton from '$lib/components/feedback/Skeleton.svelte';
	import EmptyState from '$lib/components/data/EmptyState.svelte';
	import BayarModal from '$lib/components/piutang/BayarModal.svelte';
	import {
		daftarPiutang,
		unduhEksporPiutang,
		type PiutangItem,
		type PiutangRingkasan
	} from '$lib/api/piutang';
	import type { PageMeta } from '$lib/api/barang';
	import { formatRupiah } from '$lib/domain/format';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { resolveAppPath } from '$lib/nav';
	import { ApiError } from '$lib/api/http';

	let q = $state('');
	let statusBayar = $state('');
	let kategori = $state('');
	let dateType = $state('tanggal_transaksi');
	let dateFrom = $state('');
	let dateTo = $state('');
	let brand = $state('');
	let page = $state(1);
	let rows = $state<PiutangItem[]>([]);
	let meta = $state<PageMeta>({ page: 1, per_page: 20, total: 0, total_pages: 1 });
	let ringkasan = $state<PiutangRingkasan>({
		total_nilai: '0',
		total_dibayar: '0',
		total_piutang: '0',
		piutang_overdue: '0',
		jumlah_transaksi: 0,
		jumlah_transaksi_overdue: 0
	});
	let loading = $state(true);
	let bayarOpen = $state(false);
	let bayarRow = $state<PiutangItem | null>(null);
	let debounce: ReturnType<typeof setTimeout> | undefined;

	const bisaBayar = $derived(auth.punyaIzin('pembayaran.catat'));
	const bisaEkspor = $derived(auth.punyaIzin('laporan.ekspor'));

	const bayarOpts = [
		{ value: '', label: 'Semua status' },
		{ value: 'lunas', label: 'Lunas' },
		{ value: 'hutang', label: 'Hutang' },
		{ value: 'sebagian', label: 'Sebagian' }
	];
	const kategoriOpts = [
		{ value: '', label: 'Semua kategori' },
		{ value: 'overdue', label: 'Overdue' },
		{ value: 'mendekati_jatuh_tempo', label: 'Mendekati JT' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'tanpa_jatuh_tempo', label: 'Tanpa JT' },
		{ value: 'lunas', label: 'Lunas' }
	];
	const dateTypeOpts = [
		{ value: 'tanggal_transaksi', label: 'Tanggal transaksi' },
		{ value: 'tanggal_jatuh_tempo', label: 'Jatuh tempo' },
		{ value: 'tanggal_pembayaran_terakhir', label: 'Pembayaran terakhir' }
	];

	function params() {
		return {
			q: q || undefined,
			status_pembayaran: statusBayar || undefined,
			kategori_jatuh_tempo: kategori || undefined,
			brand: brand || undefined,
			date_from: dateFrom || undefined,
			date_to: dateTo || undefined,
			date_type: dateType || undefined,
			page,
			per_page: 20
		};
	}

	async function muat() {
		loading = true;
		try {
			const res = await daftarPiutang(params());
			rows = res.data;
			meta = res.meta;
			ringkasan = res.ringkasan;
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
		void statusBayar;
		void kategori;
		void dateType;
		void dateFrom;
		void dateTo;
		void brand;
		void page;
		jadwalkanMuat();
		return () => clearTimeout(debounce);
	});

	function resetFilter() {
		q = '';
		statusBayar = '';
		kategori = '';
		dateType = 'tanggal_transaksi';
		dateFrom = '';
		dateTo = '';
		brand = '';
		page = 1;
	}

	function badgeKat(k: string): { text: string; className: string } {
		switch (k) {
			case 'overdue':
				return { text: 'Overdue', className: 'bg-red-100 text-red-800' };
			case 'mendekati_jatuh_tempo':
				return { text: 'Mendekati JT', className: 'bg-amber-100 text-amber-900' };
			case 'normal':
				return { text: 'Normal', className: 'bg-emerald-100 text-emerald-800' };
			case 'tanpa_jatuh_tempo':
				return { text: 'Tanpa JT', className: 'bg-slate-100 text-slate-600' };
			case 'lunas':
				return { text: 'Lunas', className: 'bg-slate-100 text-slate-700' };
			default:
				return { text: k || '—', className: 'bg-slate-100 text-slate-600' };
		}
	}

	function bukaBayar(row: PiutangItem) {
		bayarRow = row;
		bayarOpen = true;
	}

	async function unduh() {
		try {
			await unduhEksporPiutang(params());
			showToast('Ekspor piutang diunduh', 'sukses');
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal ekspor', 'bahaya');
		}
	}
</script>

<div class="space-y-4">
	<header class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="font-display text-2xl text-ink">Piutang</h1>
			<p class="text-sm text-muted">
				Daftar piutang & pembayaran. {#if !bisaBayar}Mode baca saja.{/if}
			</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<a
				href={resolveAppPath('/piutang/overdue')}
				class="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-900"
			>
				Overdue
			</a>
			{#if bisaEkspor}
				<button
					type="button"
					class="rounded border border-slate-300 bg-white px-4 py-2 text-sm"
					onclick={() => void unduh()}
				>
					Ekspor CSV
				</button>
			{/if}
		</div>
	</header>

	<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
		<div class="rounded border border-slate-200 bg-white px-3 py-2">
			<p class="text-xs text-slate-500">Total nilai</p>
			<p class="tabular-nums text-sm font-semibold">{formatRupiah(ringkasan.total_nilai)}</p>
		</div>
		<div class="rounded border border-slate-200 bg-white px-3 py-2">
			<p class="text-xs text-slate-500">Total dibayar</p>
			<p class="tabular-nums text-sm font-semibold">{formatRupiah(ringkasan.total_dibayar)}</p>
		</div>
		<div class="rounded border border-slate-200 bg-white px-3 py-2">
			<p class="text-xs text-slate-500">Total piutang</p>
			<p class="tabular-nums text-sm font-semibold">{formatRupiah(ringkasan.total_piutang)}</p>
		</div>
		<div class="rounded border border-red-200 bg-red-50 px-3 py-2">
			<p class="text-xs text-red-700">Piutang overdue</p>
			<p class="tabular-nums text-sm font-semibold text-red-900">
				{formatRupiah(ringkasan.piutang_overdue)}
			</p>
		</div>
		<div class="rounded border border-slate-200 bg-white px-3 py-2">
			<p class="text-xs text-slate-500">Jumlah transaksi</p>
			<p class="tabular-nums text-sm font-semibold">{ringkasan.jumlah_transaksi}</p>
		</div>
		<div class="rounded border border-red-200 bg-red-50 px-3 py-2">
			<p class="text-xs text-red-700">Transaksi overdue</p>
			<p class="tabular-nums text-sm font-semibold text-red-900">
				{ringkasan.jumlah_transaksi_overdue}
			</p>
		</div>
	</div>

	<FilterBar onreset={resetFilter}>
		<Field label="Cari" forId="piu-q">
			<input
				id="piu-q"
				class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
				placeholder="Kode/nama, no transaksi…"
				bind:value={q}
			/>
		</Field>
		<Field label="Status bayar" forId="piu-sb">
			<Combobox id="piu-sb" options={bayarOpts} bind:value={statusBayar} />
		</Field>
		<Field label="Kategori JT" forId="piu-kat">
			<Combobox id="piu-kat" options={kategoriOpts} bind:value={kategori} />
		</Field>
		<Field label="Tipe tanggal" forId="piu-dt">
			<Combobox id="piu-dt" options={dateTypeOpts} bind:value={dateType} />
		</Field>
		<Field label="Dari" forId="piu-df">
			<input
				id="piu-df"
				type="date"
				class="w-full rounded-lg border px-3 py-2 text-sm"
				bind:value={dateFrom}
			/>
		</Field>
		<Field label="Sampai" forId="piu-ds">
			<input
				id="piu-ds"
				type="date"
				class="w-full rounded-lg border px-3 py-2 text-sm"
				bind:value={dateTo}
			/>
		</Field>
		<Field label="Brand" forId="piu-br">
			<input
				id="piu-br"
				class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
				placeholder="Brand"
				bind:value={brand}
			/>
		</Field>
	</FilterBar>

	{#if loading}
		<Skeleton class="h-40 w-full" />
	{:else if rows.length === 0}
		<EmptyState title="Tidak ada piutang" description="Ubah filter atau catat transaksi approved." />
	{:else}
		<div class="overflow-x-auto rounded border border-slate-200 bg-white">
			<table class="min-w-full text-left text-sm">
				<thead class="border-b bg-slate-50 text-xs uppercase text-slate-500">
					<tr>
						<th class="px-3 py-2">No / ID</th>
						<th class="px-3 py-2">Pelanggan</th>
						<th class="px-3 py-2">Tanggal</th>
						<th class="px-3 py-2 text-right">Total</th>
						<th class="px-3 py-2 text-right">Dibayar</th>
						<th class="px-3 py-2 text-right">Sisa</th>
						<th class="px-3 py-2">Status</th>
						<th class="px-3 py-2">Kategori</th>
						<th class="px-3 py-2">Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#each rows as r (r.transaksi_id)}
						{@const kat = badgeKat(r.kategori_jatuh_tempo)}
						<tr class="border-b border-slate-100">
							<td class="px-3 py-2 tabular-nums">
								{r.no_transaksi ?? `#${r.transaksi_id}`}
							</td>
							<td class="px-3 py-2">
								<a
									class="text-brand-700 underline"
									href={resolveAppPath(`/piutang/pelanggan/${encodeURIComponent(r.kode_pelanggan)}`)}
								>
									{r.kode_pelanggan}
								</a>
								<div class="text-xs text-muted">{r.nama_pelanggan}</div>
							</td>
							<td class="px-3 py-2 whitespace-nowrap">{r.tanggal?.slice(0, 10) ?? '—'}</td>
							<td class="px-3 py-2 text-right tabular-nums">{formatRupiah(r.total_akhir)}</td>
							<td class="px-3 py-2 text-right tabular-nums">{formatRupiah(r.jumlah_dibayar)}</td>
							<td class="px-3 py-2 text-right tabular-nums">{formatRupiah(r.sisa_hutang)}</td>
							<td class="px-3 py-2">{r.status_pembayaran}</td>
							<td class="px-3 py-2">
								<span class="rounded px-1.5 py-0.5 text-xs {kat.className}">{kat.text}</span>
								{#if r.hari_terlambat > 0}
									<span class="ml-1 text-xs text-red-700">+{r.hari_terlambat}h</span>
								{/if}
							</td>
							<td class="px-3 py-2">
								{#if bisaBayar && r.status_pembayaran !== 'lunas'}
									<button
										type="button"
										class="text-sm text-brand-700 underline"
										onclick={() => bukaBayar(r)}
									>
										Bayar
									</button>
								{:else}
									—
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<Pagination
			page={meta.page}
			total={meta.total}
			totalPages={meta.total_pages}
			onpage={(p) => (page = p)}
		/>
	{/if}
</div>

<BayarModal bind:open={bayarOpen} row={bayarRow} onsukses={() => void muat()} />
