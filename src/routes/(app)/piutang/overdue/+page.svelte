<script lang="ts">
	import Pagination from '$lib/components/data/Pagination.svelte';
	import FilterBar from '$lib/components/data/FilterBar.svelte';
	import Field from '$lib/components/form/Field.svelte';
	import Skeleton from '$lib/components/feedback/Skeleton.svelte';
	import EmptyState from '$lib/components/data/EmptyState.svelte';
	import BayarModal from '$lib/components/piutang/BayarModal.svelte';
	import {
		daftarPiutangOverdue,
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
	let dateFrom = $state('');
	let dateTo = $state('');
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

	async function muat() {
		loading = true;
		try {
			const res = await daftarPiutangOverdue({
				q: q || undefined,
				date_from: dateFrom || undefined,
				date_to: dateTo || undefined,
				page,
				per_page: 20
			});
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
		void dateFrom;
		void dateTo;
		void page;
		jadwalkanMuat();
		return () => clearTimeout(debounce);
	});

	function resetFilter() {
		q = '';
		dateFrom = '';
		dateTo = '';
		page = 1;
	}
</script>

<div class="space-y-4">
	<header class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="font-display text-2xl text-ink">Piutang overdue</h1>
			<p class="text-sm text-muted">
				Transaksi lewat jatuh tempo.
				<a class="text-brand-700 underline" href={resolveAppPath('/piutang')}>← Semua piutang</a>
			</p>
		</div>
		<div class="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm">
			<span class="text-red-700">Nilai overdue:</span>
			<span class="ml-1 font-semibold tabular-nums text-red-900"
				>{formatRupiah(ringkasan.piutang_overdue)}</span
			>
			<span class="ml-2 text-red-700">({ringkasan.jumlah_transaksi_overdue} trx)</span>
		</div>
	</header>

	<FilterBar onreset={resetFilter}>
		<Field label="Cari" forId="ov-q">
			<input
				id="ov-q"
				class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
				placeholder="Kode/nama, no…"
				bind:value={q}
			/>
		</Field>
		<Field label="Dari" forId="ov-df">
			<input
				id="ov-df"
				type="date"
				class="w-full rounded-lg border px-3 py-2 text-sm"
				bind:value={dateFrom}
			/>
		</Field>
		<Field label="Sampai" forId="ov-ds">
			<input
				id="ov-ds"
				type="date"
				class="w-full rounded-lg border px-3 py-2 text-sm"
				bind:value={dateTo}
			/>
		</Field>
	</FilterBar>

	{#if loading}
		<Skeleton class="h-40 w-full" />
	{:else if rows.length === 0}
		<EmptyState title="Tidak ada overdue" description="Tidak ada piutang lewat jatuh tempo." />
	{:else}
		<div class="overflow-x-auto rounded border border-slate-200 bg-white">
			<table class="min-w-full text-left text-sm">
				<thead class="border-b bg-slate-50 text-xs uppercase text-slate-500">
					<tr>
						<th class="px-3 py-2">No / ID</th>
						<th class="px-3 py-2">Pelanggan</th>
						<th class="px-3 py-2">JT</th>
						<th class="px-3 py-2 text-right">Sisa</th>
						<th class="px-3 py-2">Terlambat</th>
						<th class="px-3 py-2">Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#each rows as r (r.transaksi_id)}
						<tr class="border-b border-slate-100">
							<td class="px-3 py-2 tabular-nums">{r.no_transaksi ?? `#${r.transaksi_id}`}</td>
							<td class="px-3 py-2">
								<a
									class="text-brand-700 underline"
									href={resolveAppPath(
										`/piutang/pelanggan/${encodeURIComponent(r.kode_pelanggan)}`
									)}
								>
									{r.kode_pelanggan}
								</a>
								<div class="text-xs text-muted">{r.nama_pelanggan}</div>
							</td>
							<td class="px-3 py-2 whitespace-nowrap"
								>{r.tanggal_jatuh_tempo?.slice(0, 10) ?? '—'}</td
							>
							<td class="px-3 py-2 text-right tabular-nums">{formatRupiah(r.sisa_hutang)}</td>
							<td class="px-3 py-2 text-red-700">+{r.hari_terlambat} hari</td>
							<td class="px-3 py-2">
								{#if bisaBayar}
									<button
										type="button"
										class="text-sm text-brand-700 underline"
										onclick={() => {
											bayarRow = r;
											bayarOpen = true;
										}}
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
