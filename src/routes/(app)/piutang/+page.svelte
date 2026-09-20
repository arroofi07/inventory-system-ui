<script lang="ts">
	import Pagination from '$lib/components/data/Pagination.svelte';
	import FilterBar from '$lib/components/data/FilterBar.svelte';
	import StatCard from '$lib/components/data/StatCard.svelte';
	import Field from '$lib/components/form/Field.svelte';
	import Combobox from '$lib/components/form/Combobox.svelte';
	import Skeleton from '$lib/components/feedback/Skeleton.svelte';
	import EmptyState from '$lib/components/data/EmptyState.svelte';
	import BayarModal from '$lib/components/piutang/BayarModal.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
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
				return { text: 'Tanpa JT', className: 'bg-primary/10 text-muted-foreground' };
			case 'lunas':
				return { text: 'Lunas', className: 'bg-primary/10 text-foreground' };
			default:
				return { text: k || '—', className: 'bg-primary/10 text-muted-foreground' };
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
			<Button
				variant="outline"
				class="border-red-200 bg-red-50 text-red-900 hover:bg-red-100"
				href={resolveAppPath('/piutang/overdue')}
			>
				Overdue
			</Button>
			{#if bisaEkspor}
				<Button variant="outline" onclick={() => void unduh()}>Ekspor CSV</Button>
			{/if}
		</div>
	</header>

	<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
		<StatCard label="Total nilai" value={formatRupiah(ringkasan.total_nilai)} />
		<StatCard label="Total dibayar" value={formatRupiah(ringkasan.total_dibayar)} />
		<StatCard label="Total piutang" value={formatRupiah(ringkasan.total_piutang)} />
		<StatCard
			label="Piutang overdue"
			value={formatRupiah(ringkasan.piutang_overdue)}
			tone="bahaya"
		/>
		<StatCard label="Jumlah transaksi" value={String(ringkasan.jumlah_transaksi)} />
		<StatCard
			label="Transaksi overdue"
			value={String(ringkasan.jumlah_transaksi_overdue)}
			tone="bahaya"
		/>
	</div>

	<FilterBar onreset={resetFilter}>
		<Field label="Cari" forId="piu-q">
			<Input
				id="piu-q"
				class="w-full"
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
			<Input id="piu-df" type="date" class="w-full" bind:value={dateFrom} />
		</Field>
		<Field label="Sampai" forId="piu-ds">
			<Input id="piu-ds" type="date" class="w-full" bind:value={dateTo} />
		</Field>
		<Field label="Brand" forId="piu-br">
			<Input id="piu-br" class="w-full" placeholder="Brand" bind:value={brand} />
		</Field>
	</FilterBar>

	{#if loading}
		<Skeleton class="h-40 w-full" />
	{:else if rows.length === 0}
		<EmptyState title="Tidak ada piutang" description="Ubah filter atau catat transaksi approved." />
	{:else}
		<div class="overflow-hidden rounded-[var(--radius-card)] border border-primary/20 bg-white">
			<Table.Root>
				<Table.Header>
					<Table.Row class="hover:bg-transparent">
						<Table.Head class="px-3 py-2">No / ID</Table.Head>
						<Table.Head class="px-3 py-2">Pelanggan</Table.Head>
						<Table.Head class="px-3 py-2">Tanggal</Table.Head>
						<Table.Head class="px-3 py-2 text-right">Total</Table.Head>
						<Table.Head class="px-3 py-2 text-right">Dibayar</Table.Head>
						<Table.Head class="px-3 py-2 text-right">Sisa</Table.Head>
						<Table.Head class="px-3 py-2">Status</Table.Head>
						<Table.Head class="px-3 py-2">Kategori</Table.Head>
						<Table.Head class="px-3 py-2">Aksi</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each rows as r (r.transaksi_id)}
						{@const kat = badgeKat(r.kategori_jatuh_tempo)}
						<Table.Row>
							<Table.Cell class="px-3 py-2 tabular-nums">
								{r.no_transaksi ?? `#${r.transaksi_id}`}
							</Table.Cell>
							<Table.Cell class="px-3 py-2">
								<Button
									variant="link"
									class="h-auto p-0"
									href={resolveAppPath(
										`/piutang/pelanggan/${encodeURIComponent(r.kode_pelanggan)}`
									)}
								>
									{r.kode_pelanggan}
								</Button>
								<div class="text-xs text-muted">{r.nama_pelanggan}</div>
							</Table.Cell>
							<Table.Cell class="px-3 py-2 whitespace-nowrap"
								>{r.tanggal?.slice(0, 10) ?? '—'}</Table.Cell
							>
							<Table.Cell class="px-3 py-2 text-right tabular-nums"
								>{formatRupiah(r.total_akhir)}</Table.Cell
							>
							<Table.Cell class="px-3 py-2 text-right tabular-nums"
								>{formatRupiah(r.jumlah_dibayar)}</Table.Cell
							>
							<Table.Cell class="px-3 py-2 text-right tabular-nums"
								>{formatRupiah(r.sisa_hutang)}</Table.Cell
							>
							<Table.Cell class="px-3 py-2">{r.status_pembayaran}</Table.Cell>
							<Table.Cell class="px-3 py-2">
								<span class="rounded px-1.5 py-0.5 text-xs {kat.className}">{kat.text}</span>
								{#if r.hari_terlambat > 0}
									<span class="ml-1 text-xs text-red-700">+{r.hari_terlambat}h</span>
								{/if}
							</Table.Cell>
							<Table.Cell class="px-3 py-2">
								{#if bisaBayar && r.status_pembayaran !== 'lunas'}
									<Button variant="link" class="h-auto p-0" onclick={() => bukaBayar(r)}>
										Bayar
									</Button>
								{:else}
									—
								{/if}
							</Table.Cell>
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

<BayarModal bind:open={bayarOpen} row={bayarRow} onsukses={() => void muat()} />
