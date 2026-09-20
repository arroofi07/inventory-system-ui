<script lang="ts">
	import { ambilDashboard, type Dashboard } from '$lib/api/dashboard';
	import { formatRupiah } from '$lib/domain/format';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { resolveAppPath } from '$lib/nav';
	import { ApiError } from '$lib/api/http';
	import Skeleton from '$lib/components/feedback/Skeleton.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { cn } from '$lib/utils.js';

	let data = $state<Dashboard | null>(null);
	let loading = $state(true);

	async function muat() {
		loading = true;
		try {
			const res = await ambilDashboard();
			data = res.data;
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal memuat dashboard', 'bahaya');
			data = null;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		void auth.siap;
		if (auth.siap && auth.terautentikasi) void muat();
	});

	type Kartu = { label: string; value: string; href?: string; accent?: boolean };
	const kartuList = $derived.by((): Kartu[] => {
		if (!data) return [];
		const k = data.kartu;
		const out: Kartu[] = [];
		if (k.transaksi_pending != null) {
			out.push({
				label: 'Pending approval',
				value: String(k.transaksi_pending),
				href: '/approval'
			});
		}
		if (k.penjualan_bulan_ini != null) {
			out.push({ label: 'Penjualan bulan ini', value: formatRupiah(k.penjualan_bulan_ini) });
		}
		if (k.jumlah_transaksi_bulan_ini != null && k.penjualan_bulan_ini == null) {
			out.push({
				label: 'Trx approved bulan ini',
				value: String(k.jumlah_transaksi_bulan_ini)
			});
		}
		if (k.total_piutang != null) {
			out.push({
				label: 'Total piutang',
				value: formatRupiah(k.total_piutang),
				href: '/piutang'
			});
		}
		if (k.piutang_overdue != null) {
			out.push({
				label: 'Piutang overdue',
				value: formatRupiah(k.piutang_overdue),
				href: '/piutang/overdue',
				accent: true
			});
		}
		if (k.sku_stok_rendah != null) {
			out.push({ label: 'SKU stok rendah', value: String(k.sku_stok_rendah), href: '/laporan-stok' });
		}
		if (k.sku_stok_habis != null) {
			out.push({
				label: 'SKU stok habis',
				value: String(k.sku_stok_habis),
				href: '/laporan-stok',
				accent: true
			});
		}
		if (k.batch_mendekati_exp != null) {
			out.push({ label: 'Batch mendekati exp', value: String(k.batch_mendekati_exp) });
		}
		return out;
	});
</script>

<div class="space-y-6">
	<header>
		<h1 class="font-display text-2xl text-ink">Dashboard</h1>
		<p class="text-sm text-muted">
			Ringkasan untuk role {data?.role ?? auth.user?.role ?? '…'}.
		</p>
	</header>

	{#if loading}
		<Skeleton class="h-28 w-full" />
	{:else if data}
		{#if data.notifikasi_piutang}
			<p class="text-sm">
				<Button variant="link" class="h-auto p-0" href={resolveAppPath('/piutang/overdue')}>
					Piutang: {data.notifikasi_piutang.overdue} overdue ·
					{data.notifikasi_piutang.mendekati_jatuh_tempo} mendekati JT
				</Button>
			</p>
		{/if}

		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each kartuList as k (k.label)}
				{#if k.href}
					<Button
						variant="outline"
						href={resolveAppPath(k.href)}
						class={cn(
							'h-auto w-full flex-col items-start justify-start gap-0 rounded-[var(--radius-card)] border p-3 shadow-none ring-0 hover:border-brand-300',
							k.accent
								? 'border-red-200 bg-red-50 hover:bg-red-50'
								: 'border-primary/20 bg-white'
						)}
					>
						<p class="text-xs font-normal text-primary/70">{k.label}</p>
						<p class="mt-1 text-lg font-semibold tabular-nums text-ink">{k.value}</p>
					</Button>
				{:else}
					<Card.Root
						class={cn(
							'gap-0 border p-3 shadow-none ring-0',
							k.accent ? 'border-red-200 bg-red-50' : 'border-primary/20 bg-white'
						)}
					>
						<p class="text-xs text-primary/70">{k.label}</p>
						<p class="mt-1 text-lg font-semibold tabular-nums">{k.value}</p>
					</Card.Root>
				{/if}
			{/each}
		</div>

		<div class="grid gap-4 lg:grid-cols-3">
			<Card.Root class="gap-0 border border-primary/20 p-3 shadow-none ring-0">
				<Card.Header class="p-0">
					<Card.Title class="font-display text-base text-ink">Pending</Card.Title>
				</Card.Header>
				<Card.Content class="p-0">
					{#if data.aktivitas_terkini.transaksi_pending.length === 0}
						<p class="mt-2 text-sm text-muted">Tidak ada.</p>
					{:else}
						<ul class="mt-2 divide-y divide-primary/10 text-sm">
							{#each data.aktivitas_terkini.transaksi_pending as a (a.id)}
								<li class="flex items-start justify-between gap-3 py-2">
									<Button
										variant="link"
										class="h-auto min-w-0 flex-1 justify-start break-words p-0 text-left whitespace-normal"
										href={resolveAppPath(`/approval/${a.id}`)}
									>
										{a.judul}
									</Button>
									{#if a.nominal}
										<span class="shrink-0 tabular-nums">{formatRupiah(a.nominal)}</span>
									{/if}
								</li>
							{/each}
						</ul>
					{/if}
				</Card.Content>
			</Card.Root>

			<Card.Root class="gap-0 border border-primary/20 p-3 shadow-none ring-0">
				<Card.Header class="p-0">
					<Card.Title class="font-display text-base text-ink">Barang masuk</Card.Title>
				</Card.Header>
				<Card.Content class="p-0">
					{#if data.aktivitas_terkini.barang_masuk.length === 0}
						<p class="mt-2 text-sm text-muted">Tidak ada.</p>
					{:else}
						<ul class="mt-2 divide-y divide-primary/10 text-sm">
							{#each data.aktivitas_terkini.barang_masuk as a (a.id)}
								<li class="py-2">
									<p>{a.judul}</p>
									<p class="text-xs text-muted">{a.subjudul}</p>
								</li>
							{/each}
						</ul>
					{/if}
				</Card.Content>
			</Card.Root>

			<Card.Root class="gap-0 border border-primary/20 p-3 shadow-none ring-0">
				<Card.Header class="p-0">
					<Card.Title class="font-display text-base text-ink">Pembayaran terkini</Card.Title>
				</Card.Header>
				<Card.Content class="p-0">
					{#if data.aktivitas_terkini.pembayaran.length === 0}
						<p class="mt-2 text-sm text-muted">Tidak ada / tidak ditampilkan untuk role ini.</p>
					{:else}
						<ul class="mt-2 divide-y divide-primary/10 text-sm">
							{#each data.aktivitas_terkini.pembayaran as a (a.id)}
								<li class="py-2">
									<p>{a.judul}</p>
									{#if a.nominal}
										<p class="tabular-nums text-xs">{formatRupiah(a.nominal)}</p>
									{/if}
								</li>
							{/each}
						</ul>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>
	{/if}
</div>
