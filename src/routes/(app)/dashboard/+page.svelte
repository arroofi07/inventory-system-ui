<script lang="ts">
	import { ambilDashboard, type Dashboard } from '$lib/api/dashboard';
	import { formatRupiah } from '$lib/domain/format';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { resolveAppPath } from '$lib/nav';
	import { ApiError } from '$lib/api/http';
	import Skeleton from '$lib/components/feedback/Skeleton.svelte';

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
			out.push({ label: 'SKU stok habis', value: String(k.sku_stok_habis), href: '/laporan-stok', accent: true });
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
				<a class="text-brand-700 underline" href={resolveAppPath('/piutang/overdue')}>
					Piutang: {data.notifikasi_piutang.overdue} overdue ·
					{data.notifikasi_piutang.mendekati_jatuh_tempo} mendekati JT
				</a>
			</p>
		{/if}

		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each kartuList as k (k.label)}
				{#if k.href}
					<a
						href={resolveAppPath(k.href)}
						class="rounded border px-3 py-3 {k.accent
							? 'border-red-200 bg-red-50'
							: 'border-slate-200 bg-white'} hover:border-brand-300"
					>
						<p class="text-xs text-slate-500">{k.label}</p>
						<p class="mt-1 text-lg font-semibold tabular-nums">{k.value}</p>
					</a>
				{:else}
					<div
						class="rounded border px-3 py-3 {k.accent
							? 'border-red-200 bg-red-50'
							: 'border-slate-200 bg-white'}"
					>
						<p class="text-xs text-slate-500">{k.label}</p>
						<p class="mt-1 text-lg font-semibold tabular-nums">{k.value}</p>
					</div>
				{/if}
			{/each}
		</div>

		<div class="grid gap-4 lg:grid-cols-3">
			<section class="rounded border border-slate-200 bg-white p-3">
				<h2 class="font-display text-base text-ink">Pending</h2>
				{#if data.aktivitas_terkini.transaksi_pending.length === 0}
					<p class="mt-2 text-sm text-muted">Tidak ada.</p>
				{:else}
					<ul class="mt-2 divide-y divide-slate-100 text-sm">
						{#each data.aktivitas_terkini.transaksi_pending as a (a.id)}
							<li class="flex items-start justify-between gap-3 py-2">
								<a class="min-w-0 flex-1 break-words text-brand-700 underline" href={resolveAppPath(`/approval/${a.id}`)}
									>{a.judul}</a
								>
								{#if a.nominal}
									<span class="shrink-0 tabular-nums">{formatRupiah(a.nominal)}</span>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</section>

			<section class="rounded border border-slate-200 bg-white p-3">
				<h2 class="font-display text-base text-ink">Barang masuk</h2>
				{#if data.aktivitas_terkini.barang_masuk.length === 0}
					<p class="mt-2 text-sm text-muted">Tidak ada.</p>
				{:else}
					<ul class="mt-2 divide-y divide-slate-100 text-sm">
						{#each data.aktivitas_terkini.barang_masuk as a (a.id)}
							<li class="py-2">
								<p>{a.judul}</p>
								<p class="text-xs text-muted">{a.subjudul}</p>
							</li>
						{/each}
					</ul>
				{/if}
			</section>

			<section class="rounded border border-slate-200 bg-white p-3">
				<h2 class="font-display text-base text-ink">Pembayaran terkini</h2>
				{#if data.aktivitas_terkini.pembayaran.length === 0}
					<p class="mt-2 text-sm text-muted">Tidak ada / tidak ditampilkan untuk role ini.</p>
				{:else}
					<ul class="mt-2 divide-y divide-slate-100 text-sm">
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
			</section>
		</div>
	{/if}
</div>
