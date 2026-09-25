<script lang="ts">
	import { page } from '$app/state';
	import AppShell from '$lib/components/layout/AppShell.svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import Topbar from '$lib/components/layout/Topbar.svelte';
	import { pergiKe, resolveAppPath } from '$lib/nav';
	import { auth } from '$lib/stores/auth.svelte';

	let { children } = $props();

	const judulHalaman = $derived.by(() => {
		const path = page.url.pathname;
		if (path.includes('/piutang/overdue')) return 'Piutang overdue';
		if (path.includes('/piutang/pelanggan/')) return 'Piutang pelanggan';
		if (path.includes('/piutang')) return 'Piutang';
		if (path.includes('/pembayaran')) return 'Piutang';
		if (path.includes('/transaksi/baru')) return 'Transaksi baru';
		if (/\/transaksi\/\d+/.test(path)) return 'Detail transaksi';
		if (path.includes('/transaksi')) return 'Transaksi';
		const labels: Record<string, string> = {
			'/dashboard': 'Dashboard',
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
		}
		return labels[path] ?? 'sistem-barang';
	});

	let navOpen = $state(false);

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
		<div class="flex h-full min-h-0">
			<Sidebar bind:open={navOpen} />
			<div class="flex min-h-0 min-w-0 flex-1 flex-col">
				<Topbar title={judulHalaman} bind:open={navOpen} />
				<main
					class="min-h-0 flex-1 overflow-y-auto overflow-x-clip p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-6"
				>{@render children()}</main>
			</div>
		</div>
	</AppShell>
{/if}
