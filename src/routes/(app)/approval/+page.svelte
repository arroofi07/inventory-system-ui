<script lang="ts">
	import Pagination from '$lib/components/data/Pagination.svelte';
	import FilterBar from '$lib/components/data/FilterBar.svelte';
	import Field from '$lib/components/form/Field.svelte';
	import Combobox from '$lib/components/form/Combobox.svelte';
	import Modal from '$lib/components/feedback/Modal.svelte';
	import Skeleton from '$lib/components/feedback/Skeleton.svelte';
	import EmptyState from '$lib/components/data/EmptyState.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import {
		daftarTransaksi,
		bulkApproveTransaksi,
		type TransaksiListItem,
		type BulkApproveResult
	} from '$lib/api/transaksi';
	import type { PageMeta } from '$lib/api/barang';
	import { formatRupiah } from '$lib/domain/format';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { pergiKe } from '$lib/nav';
	import { ApiError, apiDownload } from '$lib/api/http';

	let q = $state('');
	let statusBayar = $state('');
	let kecukupanStok = $state('');
	let dateFrom = $state('');
	let dateTo = $state('');
	let page = $state(1);
	let rows = $state<TransaksiListItem[]>([]);
	let meta = $state<PageMeta>({ page: 1, per_page: 20, total: 0, total_pages: 1 });
	let loading = $state(true);
	let selected = $state<Record<number, boolean>>({});
	let menyimpanBulk = $state(false);
	let hasilBulk = $state<BulkApproveResult | null>(null);
	let hasilOpen = $state(false);
	let debounce: ReturnType<typeof setTimeout> | undefined;

	const bisaAksi = $derived(auth.punyaIzin('approval.lakukan'));
	const bisaEkspor = $derived(auth.punyaIzin('laporan.ekspor'));

	const bayarOpts = [
		{ value: '', label: 'Semua bayar' },
		{ value: 'lunas', label: 'Lunas' },
		{ value: 'hutang', label: 'Hutang' },
		{ value: 'sebagian', label: 'Sebagian' }
	];
	const kecukupanOpts = [
		{ value: '', label: 'Semua stok' },
		{ value: 'cukup', label: 'Stok cukup' },
		{ value: 'kurang', label: 'Stok kurang' }
	];

	const idsDipilih = $derived(rows.filter((r) => selected[r.id]).map((r) => r.id));
	const semuaDipilih = $derived(rows.length > 0 && rows.every((r) => selected[r.id]));

	async function muat() {
		loading = true;
		try {
			const res = await daftarTransaksi({
				q: q || undefined,
				status_approval: 'pending',
				status_pembayaran: statusBayar || undefined,
				kecukupan_stok: kecukupanStok || undefined,
				date_from: dateFrom || undefined,
				date_to: dateTo || undefined,
				page,
				per_page: 20
			});
			rows = res.data;
			meta = res.meta;
			selected = {};
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
		void kecukupanStok;
		void dateFrom;
		void dateTo;
		void page;
		jadwalkanMuat();
		return () => clearTimeout(debounce);
	});

	function resetFilter() {
		q = '';
		statusBayar = '';
		kecukupanStok = '';
		dateFrom = '';
		dateTo = '';
		page = 1;
	}

	function toggleSemua(checked: boolean) {
		const next: Record<number, boolean> = {};
		if (checked) {
			for (const r of rows) next[r.id] = true;
		}
		selected = next;
	}

	function onSelectAllChange(v: boolean | 'indeterminate') {
		toggleSemua(v === true);
	}

	function onRowSelectChange(id: number, v: boolean | 'indeterminate') {
		selected = { ...selected, [id]: v === true };
	}

	function labelStok(r: TransaksiListItem): { text: string; className: string } {
		if (r.stok_cukup === true) return { text: 'Cukup', className: 'bg-emerald-100 text-emerald-800' };
		if (r.stok_cukup === false) return { text: 'Kurang', className: 'bg-red-100 text-red-800' };
		return { text: '—', className: 'bg-primary/10 text-muted-foreground' };
	}

	async function jalankanBulk() {
		if (!bisaAksi || idsDipilih.length === 0 || menyimpanBulk) return;
		menyimpanBulk = true;
		try {
			const res = await bulkApproveTransaksi({ transaksi_ids: idsDipilih });
			hasilBulk = res.data;
			hasilOpen = true;
			const ring = res.data.ringkasan;
			showToast(
				`${ring.berhasil}/${ring.total} disetujui` +
					(ring.gagal ? `, ${ring.gagal} gagal` : ''),
				ring.gagal > 0 ? 'bahaya' : 'sukses'
			);
			await muat();
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Bulk approve gagal', 'bahaya');
		} finally {
			menyimpanBulk = false;
		}
	}

	async function unduhEksporApproved() {
		try {
			const qs = new URLSearchParams();
			if (dateFrom) qs.set('date_from', dateFrom);
			if (dateTo) qs.set('date_to', dateTo);
			// Default API = approved; jangan kirim pending antrian.
			const s = qs.toString();
			await apiDownload(`/laporan/penjualan/export${s ? `?${s}` : ''}`, 'laporan-penjualan.csv');
			showToast('Ekspor penjualan (approved) diunduh', 'sukses');
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal ekspor', 'bahaya');
		}
	}
</script>

<div class="space-y-4">
	<header class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="font-display text-2xl text-ink">Persetujuan</h1>
			<p class="text-sm text-muted">
				Antrian transaksi pending. {#if !bisaAksi}Mode baca saja.{/if}
			</p>
		</div>
		<div class="flex flex-wrap gap-2">
			{#if bisaEkspor}
				<Button variant="outline" onclick={() => void unduhEksporApproved()}>
					Ekspor penjualan
				</Button>
			{/if}
			{#if bisaAksi}
				<Button
					disabled={idsDipilih.length === 0 || menyimpanBulk}
					onclick={() => void jalankanBulk()}
				>
					{menyimpanBulk ? 'Memproses…' : `Setujui terpilih (${idsDipilih.length})`}
				</Button>
			{/if}
		</div>
	</header>

	<FilterBar onreset={resetFilter}>
		<Field label="Cari" forId="ap-q">
			<Input
				id="ap-q"
				class="w-full"
				placeholder="Kode/nama pelanggan, ID, no…"
				bind:value={q}
			/>
		</Field>
		<Field label="Status bayar" forId="ap-sb">
			<Combobox id="ap-sb" options={bayarOpts} bind:value={statusBayar} />
		</Field>
		<Field label="Kecukupan stok" forId="ap-ks">
			<Combobox id="ap-ks" options={kecukupanOpts} bind:value={kecukupanStok} />
		</Field>
		<Field label="Dari tanggal" forId="ap-df">
			<Input id="ap-df" type="date" class="w-full" bind:value={dateFrom} />
		</Field>
		<Field label="Sampai" forId="ap-dt">
			<Input id="ap-dt" type="date" class="w-full" bind:value={dateTo} />
		</Field>
	</FilterBar>

	<div class="overflow-hidden rounded-[var(--radius-card)] border border-primary/20 bg-white">
		<Table.Root>
			<Table.Header>
				<Table.Row class="hover:bg-transparent">
					{#if bisaAksi}
						<Table.Head class="px-3 py-2.5">
							<Checkbox
								aria-label="Pilih semua"
								checked={semuaDipilih}
								onCheckedChange={onSelectAllChange}
							/>
						</Table.Head>
					{/if}
					<Table.Head class="px-3 py-2.5">ID</Table.Head>
					<Table.Head class="px-3 py-2.5">Tanggal</Table.Head>
					<Table.Head class="px-3 py-2.5">Pelanggan</Table.Head>
					<Table.Head class="px-3 py-2.5">Bayar</Table.Head>
					<Table.Head class="px-3 py-2.5">Stok</Table.Head>
					<Table.Head class="px-3 py-2.5">Qty</Table.Head>
					<Table.Head class="px-3 py-2.5 text-right">Total akhir</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if loading}
					{#each Array(5) as _, i (i)}
						<Table.Row>
							{#each Array(bisaAksi ? 8 : 7) as __, j (j)}
								<Table.Cell class="px-3 py-3"><Skeleton class="h-4 w-full" /></Table.Cell>
							{/each}
						</Table.Row>
					{/each}
				{:else if rows.length === 0}
					<Table.Row class="hover:bg-transparent">
						<Table.Cell colspan={bisaAksi ? 8 : 7} class="whitespace-normal p-0">
							<EmptyState
								title="Antrian kosong"
								description="Tidak ada transaksi pending sesuai filter."
							/>
						</Table.Cell>
					</Table.Row>
				{:else}
					{#each rows as r (r.id)}
						{@const stok = labelStok(r)}
						<Table.Row
							class="cursor-pointer hover:bg-brand-50/60"
							onclick={() => void pergiKe(`/approval/${r.id}`)}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									void pergiKe(`/approval/${r.id}`);
								}
							}}
							tabindex={0}
							role="button"
						>
							{#if bisaAksi}
								<Table.Cell class="px-3 py-2.5" onclick={(e) => e.stopPropagation()}>
									<Checkbox
										aria-label={`Pilih transaksi ${r.id}`}
										checked={Boolean(selected[r.id])}
										onCheckedChange={(v) => onRowSelectChange(r.id, v)}
									/>
								</Table.Cell>
							{/if}
							<Table.Cell class="px-3 py-2.5 text-ink">{r.id}</Table.Cell>
							<Table.Cell class="px-3 py-2.5 text-ink">{r.tanggal}</Table.Cell>
							<Table.Cell class="px-3 py-2.5 text-ink">
								{r.kode_pelanggan} — {r.nama_pelanggan}
							</Table.Cell>
							<Table.Cell class="px-3 py-2.5 text-ink">{r.status_pembayaran}</Table.Cell>
							<Table.Cell class="px-3 py-2.5">
								<span class="rounded px-2 py-0.5 text-xs font-medium {stok.className}"
									>{stok.text}</span
								>
							</Table.Cell>
							<Table.Cell class="px-3 py-2.5 text-ink"
								>{r.total_qty_ditagih}/{r.total_qty_keluar}</Table.Cell
							>
							<Table.Cell class="px-3 py-2.5 text-right tabular-nums text-ink"
								>{formatRupiah(r.total_akhir)}</Table.Cell
							>
						</Table.Row>
					{/each}
				{/if}
			</Table.Body>
		</Table.Root>
	</div>

	<Pagination
		page={meta.page}
		totalPages={meta.total_pages}
		total={meta.total}
		onpage={(p) => (page = p)}
	/>
</div>

<Modal bind:open={hasilOpen} title="Hasil bulk approve">
	{#if hasilBulk}
		<p class="font-medium text-ink">
			{hasilBulk.ringkasan.berhasil} dari {hasilBulk.ringkasan.total} transaksi disetujui
		</p>
		{#if hasilBulk.berhasil.length > 0}
			<ul class="mt-3 space-y-1 text-sm text-emerald-800">
				{#each hasilBulk.berhasil as b (b.id)}
					<li>
						#{b.id}
						{#if b.no_transaksi}
							· <span class="font-semibold">{b.no_transaksi}</span>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
		{#if hasilBulk.gagal.length > 0}
			<ul class="mt-3 space-y-2 text-sm text-red-700">
				{#each hasilBulk.gagal as g (g.id)}
					<li>
						Transaksi #{g.id}: {g.message ?? 'Gagal'}
						{#if g.details?.length}
							<ul class="ml-4 mt-1 text-muted-foreground">
								{#each g.details as d (d.kode_item)}
									<li>{d.nama_item}: diminta {d.diminta}, tersedia {d.tersedia}</li>
								{/each}
							</ul>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
	{#snippet footer()}
		<Button variant="outline" onclick={() => (hasilOpen = false)}>Tutup</Button>
	{/snippet}
</Modal>
