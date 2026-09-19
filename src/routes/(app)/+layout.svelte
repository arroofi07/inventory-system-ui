<script lang="ts">
	import { page } from '$app/state';
	import AppShell from '$lib/components/layout/AppShell.svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import Topbar from '$lib/components/layout/Topbar.svelte';
	import Toast from '$lib/components/feedback/Toast.svelte';
	import { pergiKe, resolveAppPath } from '$lib/nav';
	import { auth } from '$lib/stores/auth.svelte';

	let { children } = $props();

	const judulHalaman = $derived.by(() => {
		const path = page.url.pathname;
		if (path.includes('/piutang/overdue')) return 'Piutang overdue';
		if (path.includes('/piutang/pelanggan/')) return 'Piutang pelanggan';
		if (path.includes('/piutang')) return 'Piutang';
		if (path.includes('/pembayaran')) return 'Piutang';
		const labels: Record<string, string> = {
			'/dashboard': 'Dashboard',
			'/transaksi': 'Transaksi',
			'/approval': 'Persetujuan',
			'/barang': 'Data Barang',
			'/barang-masuk': 'Barang Masuk',
			'/barang-keluar': 'Barang Keluar',
			'/laporan-stok': 'Laporan Stok',
			'/pelanggan': 'Pelanggan',
			'/promo': 'Promo',
			'/users': 'Pengguna',
			'/channel-analytics': 'Channel Analytics',
			'/laporan-penjualan': 'Laporan Penjualan'
		};
		return labels[path] ?? 'PKB Web';
	});

	$effect(() => {
		if (!auth.siap) return;
		if (!auth.terautentikasi) {
			const next = encodeURIComponent(page.url.pathname + page.url.search);
			void pergiKe(`${resolveAppPath('/login')}?next=${next}`);
		}
	});
</script>

{#if !auth.siap}
	<p class="p-6 text-sm text-[var(--color-muted)]">Memuat sesi…</p>
{:else if auth.terautentikasi}
	<AppShell>
		<div class="flex min-h-screen">
			<Sidebar />
			<div class="flex min-w-0 flex-1 flex-col">
				<Topbar title={judulHalaman} />
				<main class="flex-1 p-4 md:p-6">{@render children()}</main>
			</div>
		</div>
		<Toast />
	</AppShell>
{/if}
