<script lang="ts">
	import Pagination from '$lib/components/data/Pagination.svelte';
	import FilterBar from '$lib/components/data/FilterBar.svelte';
	import Field from '$lib/components/form/Field.svelte';
	import Combobox from '$lib/components/form/Combobox.svelte';
	import Modal from '$lib/components/feedback/Modal.svelte';
	import Skeleton from '$lib/components/feedback/Skeleton.svelte';
	import EmptyState from '$lib/components/data/EmptyState.svelte';
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

	function labelStok(r: TransaksiListItem): { text: string; className: string } {
		if (r.stok_cukup === true) return { text: 'Cukup', className: 'bg-emerald-100 text-emerald-800' };
		if (r.stok_cukup === false) return { text: 'Kurang', className: 'bg-red-100 text-red-800' };
		return { text: '—', className: 'bg-slate-100 text-slate-600' };
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
				<button
					type="button"
					class="rounded border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800"
					onclick={() => void unduhEksporApproved()}
				>
					Ekspor penjualan
				</button>
			{/if}
			{#if bisaAksi}
				<button
					type="button"
					class="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
					disabled={idsDipilih.length === 0 || menyimpanBulk}
					onclick={() => void jalankanBulk()}
				>
					{menyimpanBulk
						? 'Memproses…'
						: `Setujui terpilih (${idsDipilih.length})`}
				</button>
			{/if}
		</div>
	</header>

	<FilterBar onreset={resetFilter}>
		<Field label="Cari" forId="ap-q">
			<input
				id="ap-q"
				class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
			<input
				id="ap-df"
				type="date"
				class="w-full rounded-lg border px-3 py-2 text-sm"
				bind:value={dateFrom}
			/>
		</Field>
		<Field label="Sampai" forId="ap-dt">
			<input
				id="ap-dt"
				type="date"
				class="w-full rounded-lg border px-3 py-2 text-sm"
				bind:value={dateTo}
			/>
		</Field>
	</FilterBar>

	<div class="overflow-hidden rounded-[var(--radius-card)] border border-slate-200 bg-white">
		<div class="overflow-x-auto">
			<table class="min-w-full text-sm">
				<thead class="bg-surface text-left text-xs font-semibold uppercase tracking-wide text-muted">
					<tr>
						{#if bisaAksi}
							<th class="px-3 py-2.5">
								<input
									type="checkbox"
									aria-label="Pilih semua"
									checked={semuaDipilih}
									onchange={(e) =>
										toggleSemua((e.currentTarget as HTMLInputElement).checked)}
								/>
							</th>
						{/if}
						<th class="px-3 py-2.5">ID</th>
						<th class="px-3 py-2.5">Tanggal</th>
						<th class="px-3 py-2.5">Pelanggan</th>
						<th class="px-3 py-2.5">Bayar</th>
						<th class="px-3 py-2.5">Stok</th>
						<th class="px-3 py-2.5">Qty</th>
						<th class="px-3 py-2.5 text-right">Total akhir</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#if loading}
						{#each Array(5) as _, i (i)}
							<tr>
								{#each Array(bisaAksi ? 8 : 7) as __, j (j)}
									<td class="px-3 py-3"><Skeleton class="h-4 w-full" /></td>
								{/each}
							</tr>
						{/each}
					{:else if rows.length === 0}
						<tr>
							<td colspan={bisaAksi ? 8 : 7} class="p-0">
								<EmptyState
									title="Antrian kosong"
									description="Tidak ada transaksi pending sesuai filter."
								/>
							</td>
						</tr>
					{:else}
						{#each rows as r (r.id)}
							{@const stok = labelStok(r)}
							<tr
								class="cursor-pointer hover:bg-brand-50/60"
								onclick={() => void pergiKe(`/approval/${r.id}`)}
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										void pergiKe(`/approval/${r.id}`);
									}
								}}
								tabindex="0"
								role="button"
							>
								{#if bisaAksi}
									<td class="px-3 py-2.5" onclick={(e) => e.stopPropagation()}>
										<input
											type="checkbox"
											aria-label={`Pilih transaksi ${r.id}`}
											checked={Boolean(selected[r.id])}
											onchange={(e) => {
												selected = {
													...selected,
													[r.id]: (e.currentTarget as HTMLInputElement).checked
												};
											}}
										/>
									</td>
								{/if}
								<td class="px-3 py-2.5 text-ink">{r.id}</td>
								<td class="px-3 py-2.5 text-ink">{r.tanggal}</td>
								<td class="px-3 py-2.5 text-ink">
									{r.kode_pelanggan} — {r.nama_pelanggan}
								</td>
								<td class="px-3 py-2.5 text-ink">{r.status_pembayaran}</td>
								<td class="px-3 py-2.5">
									<span class="rounded px-2 py-0.5 text-xs font-medium {stok.className}"
										>{stok.text}</span
									>
								</td>
								<td class="px-3 py-2.5 text-ink"
									>{r.total_qty_ditagih}/{r.total_qty_keluar}</td
								>
								<td class="px-3 py-2.5 text-right tabular-nums text-ink"
									>{formatRupiah(r.total_akhir)}</td
								>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
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
							<ul class="ml-4 mt-1 text-slate-600">
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
		<button
			type="button"
			class="rounded border border-slate-200 px-3 py-1.5 text-sm"
			onclick={() => (hasilOpen = false)}>Tutup</button
		>
	{/snippet}
</Modal>
