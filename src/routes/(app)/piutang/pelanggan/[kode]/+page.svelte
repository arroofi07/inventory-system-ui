<script lang="ts">
	import { page } from '$app/state';
	import Pagination from '$lib/components/data/Pagination.svelte';
	import StatCard from '$lib/components/data/StatCard.svelte';
	import Skeleton from '$lib/components/feedback/Skeleton.svelte';
	import EmptyState from '$lib/components/data/EmptyState.svelte';
	import BayarModal from '$lib/components/piutang/BayarModal.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import {
		piutangPelanggan,
		riwayatPiutangPelanggan,
		type PiutangItem,
		type PiutangRingkasan,
		type RiwayatPembayaranItem
	} from '$lib/api/piutang';
	import type { PageMeta } from '$lib/api/barang';
	import { formatRupiah } from '$lib/domain/format';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { resolveAppPath } from '$lib/nav';
	import { ApiError } from '$lib/api/http';

	const kode = $derived(decodeURIComponent(page.params.kode ?? ''));

	let pageNum = $state(1);
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
	let riwayat = $state<RiwayatPembayaranItem[]>([]);
	let loading = $state(true);
	let bayarOpen = $state(false);
	let bayarRow = $state<PiutangItem | null>(null);

	const bisaBayar = $derived(auth.punyaIzin('pembayaran.catat'));
	const namaPelanggan = $derived(rows[0]?.nama_pelanggan ?? kode);

	async function muat() {
		if (!kode) return;
		loading = true;
		try {
			const [listRes, riwRes] = await Promise.all([
				piutangPelanggan(kode, { page: pageNum, per_page: 20 }),
				riwayatPiutangPelanggan(kode)
			]);
			rows = listRes.data;
			meta = listRes.meta;
			ringkasan = listRes.ringkasan;
			riwayat = riwRes.data;
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal memuat', 'bahaya');
			rows = [];
			riwayat = [];
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		void kode;
		void pageNum;
		void muat();
	});
</script>

<div class="space-y-4">
	<header>
		<Button variant="link" class="h-auto p-0" href={resolveAppPath('/piutang')}>← Piutang</Button>
		<h1 class="font-display mt-2 text-2xl text-ink">{namaPelanggan}</h1>
		<p class="text-sm text-muted">Kode {kode}</p>
	</header>

	<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
		<StatCard label="Total nilai" value={formatRupiah(ringkasan.total_nilai)} />
		<StatCard label="Dibayar" value={formatRupiah(ringkasan.total_dibayar)} />
		<StatCard label="Sisa piutang" value={formatRupiah(ringkasan.total_piutang)} />
		<StatCard
			label="Overdue"
			value={formatRupiah(ringkasan.piutang_overdue)}
			tone="bahaya"
		/>
	</div>

	<Card.Root class="gap-0 border border-primary/20 p-4 shadow-none ring-0">
		<Card.Header class="p-0 pb-3">
			<Card.Title class="font-display text-lg text-ink">Transaksi</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-2 p-0">
			{#if loading}
				<Skeleton class="h-32 w-full" />
			{:else if rows.length === 0}
				<EmptyState title="Tidak ada transaksi" description="Pelanggan ini tidak punya piutang." />
			{:else}
				<div class="overflow-hidden rounded-[var(--radius-card)] border border-primary/20 bg-white">
					<Table.Root>
						<Table.Header>
							<Table.Row class="hover:bg-transparent">
								<Table.Head class="px-3 py-2">No / ID</Table.Head>
								<Table.Head class="px-3 py-2">Tanggal</Table.Head>
								<Table.Head class="px-3 py-2 text-right">Total</Table.Head>
								<Table.Head class="px-3 py-2 text-right">Dibayar</Table.Head>
								<Table.Head class="px-3 py-2 text-right">Sisa</Table.Head>
								<Table.Head class="px-3 py-2">Status</Table.Head>
								<Table.Head class="px-3 py-2">Aksi</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each rows as r (r.transaksi_id)}
								<Table.Row>
									<Table.Cell class="px-3 py-2 tabular-nums"
										>{r.no_transaksi ?? `#${r.transaksi_id}`}</Table.Cell
									>
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
										{#if bisaBayar && r.status_pembayaran !== 'lunas'}
											<Button
												variant="link"
												class="h-auto p-0"
												onclick={() => {
													bayarRow = r;
													bayarOpen = true;
												}}
											>
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
					onpage={(p) => (pageNum = p)}
				/>
			{/if}
		</Card.Content>
	</Card.Root>

	<Card.Root class="gap-0 border border-primary/20 p-4 shadow-none ring-0">
		<Card.Header class="p-0 pb-3">
			<Card.Title class="font-display text-lg text-ink">Riwayat pembayaran</Card.Title>
		</Card.Header>
		<Card.Content class="p-0">
			{#if riwayat.length === 0}
				<p class="text-sm text-muted">Belum ada riwayat.</p>
			{:else}
				<div class="overflow-hidden rounded-[var(--radius-card)] border border-primary/20 bg-white">
					<Table.Root>
						<Table.Header>
							<Table.Row class="hover:bg-transparent">
								<Table.Head class="px-3 py-2">Waktu</Table.Head>
								<Table.Head class="px-3 py-2 text-right">Nominal</Table.Head>
								<Table.Head class="px-3 py-2">Status</Table.Head>
								<Table.Head class="px-3 py-2">Metode</Table.Head>
								<Table.Head class="px-3 py-2">Keterangan</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each riwayat as h (h.id)}
								<Table.Row>
									<Table.Cell class="px-3 py-2 whitespace-nowrap"
										>{h.changed_at?.slice(0, 19) ?? '—'}</Table.Cell
									>
									<Table.Cell class="px-3 py-2 text-right tabular-nums"
										>{formatRupiah(h.nominal_pembayaran)}</Table.Cell
									>
									<Table.Cell class="px-3 py-2 text-xs">
										{h.old_status ?? '—'} → {h.new_status ?? '—'}
									</Table.Cell>
									<Table.Cell class="px-3 py-2">{h.metode_pembayaran ?? '—'}</Table.Cell>
									<Table.Cell class="px-3 py-2 text-muted">{h.keterangan ?? '—'}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>

<BayarModal bind:open={bayarOpen} row={bayarRow} onsukses={() => void muat()} />
