<script lang="ts">
	import { page } from '$app/state';
	import Badge from '$lib/components/data/Badge.svelte';
	import {
		detailBarang,
		pathTambahStok,
		setStatusBarang,
		type Barang
	} from '$lib/api/barang';
	import { ApiError } from '$lib/api/http';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { resolveAppPath } from '$lib/nav';

	let barang = $state<Barang | null>(null);
	let loading = $state(true);
	let error = $state('');

	const id = $derived(Number(page.params.id));
	const bisaKelola = $derived(auth.punyaIzin('barang.kelola'));
	const bisaTambahStok = $derived(auth.punyaIzin('barang_masuk.buat'));
	const bisaHarga = $derived(auth.punyaIzin('harga.kelola'));

	$effect(() => {
		const currentId = id;
		if (!Number.isFinite(currentId) || currentId <= 0) {
			error = 'ID tidak valid';
			loading = false;
			return;
		}
		loading = true;
		error = '';
		void detailBarang(currentId)
			.then((res) => {
				barang = res.data;
			})
			.catch((e) => {
				error = e instanceof ApiError ? e.body.message : 'Gagal memuat';
				barang = null;
			})
			.finally(() => {
				loading = false;
			});
	});

	async function toggleAktif() {
		if (!barang || !bisaKelola) return;
		try {
			const res = await setStatusBarang(barang.id, !barang.is_active);
			barang = res.data;
			showToast(
				barang.is_active ? 'Barang diaktifkan kembali' : 'Barang dinonaktifkan (tersembunyi dari search)',
				'sukses'
			);
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal ubah status', 'bahaya');
		}
	}
</script>

<div class="space-y-4">
	<a href={resolveAppPath('/barang')} class="text-sm text-brand-700 underline">← Kembali ke daftar</a>

	{#if loading}
		<p class="text-sm text-muted">Memuat…</p>
	{:else if error}
		<p class="text-sm text-bahaya">{error}</p>
	{:else if barang}
		<header class="flex flex-wrap items-start justify-between gap-3">
			<div>
				<p class="font-mono text-sm text-muted">{barang.kode_barang}</p>
				<h1 class="font-display text-2xl text-ink">{barang.nama_item}</h1>
				<p class="text-sm text-muted">{barang.brand} · {barang.satuan}</p>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				<Badge status={barang.status_stok} label={barang.status_stok} />
				{#if !barang.is_active}
					<Badge tone="netral" label="Nonaktif" />
				{/if}
			</div>
		</header>

		<section class="grid gap-3 sm:grid-cols-3">
			<div class="rounded-[var(--radius-card)] border border-slate-200 bg-white p-4">
				<p class="text-xs uppercase text-muted">Stok tersedia</p>
				<p class="font-display text-3xl tabular-nums">{barang.stok_tersedia}</p>
				<p class="text-xs text-muted">Sumber: saldo ledger resmi</p>
			</div>
			<div class="rounded-[var(--radius-card)] border border-slate-200 bg-white p-4">
				<p class="text-xs uppercase text-muted">Min / reorder</p>
				<p class="text-lg tabular-nums">{barang.min_stock} / {barang.reorder_point}</p>
			</div>
			<div class="rounded-[var(--radius-card)] border border-slate-200 bg-white p-4">
				<p class="text-xs uppercase text-muted">Alokasi</p>
				<p class="text-lg">{barang.metode_alokasi}</p>
				<p class="text-xs text-muted">Alert exp {barang.expiry_alert_days} hari</p>
			</div>
		</section>

		<div class="flex flex-wrap gap-2">
			{#if bisaTambahStok && barang.is_active}
				<a
					href={resolveAppPath(pathTambahStok(barang.kode_barang))}
					class="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
				>
					Tambah stok
				</a>
			{/if}
			{#if bisaHarga}
				<a
					href={resolveAppPath(`/barang/${barang.id}/harga-massal`)}
					class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-surface"
				>
					Harga massal
				</a>
				<a
					href={resolveAppPath(`/barang/${barang.id}/riwayat-harga`)}
					class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-surface"
				>
					Riwayat harga
				</a>
			{/if}
			{#if bisaKelola}
				<a
					href={resolveAppPath(`/barang/${barang.id}/ubah`)}
					class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-surface"
				>
					Ubah
				</a>
				<button
					type="button"
					class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-surface"
					onclick={() => void toggleAktif()}
				>
					{barang.is_active ? 'Nonaktifkan' : 'Aktifkan kembali'}
				</button>
			{/if}
		</div>
	{/if}
</div>
