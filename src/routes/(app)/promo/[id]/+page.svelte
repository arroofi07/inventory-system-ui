<script lang="ts">
	import { page } from '$app/state';
	import Badge from '$lib/components/data/Badge.svelte';
	import { detailPromo, hapusPromo, setStatusPromo, type Promo } from '$lib/api/promo';
	import { ApiError } from '$lib/api/http';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { pergiKe, resolveAppPath } from '$lib/nav';
	import { formatRupiah } from '$lib/domain/format';

	let item = $state<Promo | null>(null);
	let loading = $state(true);
	let error = $state('');

	const id = $derived(Number(page.params.id));
	const bisaKelola = $derived(auth.punyaIzin('promo.kelola'));
	const bisaHapus = $derived(auth.punyaIzin('promo.hapus'));

	$effect(() => {
		const currentId = id;
		if (!Number.isFinite(currentId) || currentId <= 0) {
			error = 'ID tidak valid';
			loading = false;
			return;
		}
		loading = true;
		error = '';
		void detailPromo(currentId)
			.then((res) => {
				item = res.data;
			})
			.catch((e) => {
				error = e instanceof ApiError ? e.body.message : 'Gagal memuat';
				item = null;
			})
			.finally(() => {
				loading = false;
			});
	});

	async function toggleAktif() {
		if (!item || !bisaKelola) return;
		try {
			const res = await setStatusPromo(item.id, !item.is_active);
			item = res.data;
			showToast(item.is_active ? 'Promo diaktifkan' : 'Promo dinonaktifkan', 'sukses');
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal ubah status', 'bahaya');
		}
	}

	async function konfirmasiHapus() {
		if (!item || !bisaHapus) return;
		if (!confirm(`Hapus promo ${item.kode_promo}? Lebih aman nonaktifkan.`)) return;
		try {
			await hapusPromo(item.id);
			showToast('Promo dihapus', 'sukses');
			await pergiKe('/promo');
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal menghapus', 'bahaya');
		}
	}
</script>

<div class="space-y-4">
	<a href={resolveAppPath('/promo')} class="text-sm text-brand-700 underline">← Kembali ke daftar</a>

	{#if loading}
		<p class="text-sm text-muted">Memuat…</p>
	{:else if error}
		<p class="text-sm text-bahaya">{error}</p>
	{:else if item}
		<header class="flex flex-wrap items-start justify-between gap-3">
			<div>
				<p class="font-mono text-sm text-muted">{item.kode_promo}</p>
				<h1 class="font-display text-2xl text-ink">{item.nama_promo}</h1>
				<p class="text-sm text-muted">{item.tipe_promo}</p>
			</div>
			{#if item.is_active}
				<Badge tone="sukses" label="Aktif" />
			{:else}
				<Badge tone="netral" label="Nonaktif" />
			{/if}
		</header>

		<section class="rounded-[var(--radius-card)] border border-slate-200 bg-white p-4 text-sm space-y-1">
			<p>
				<span class="text-muted">Periode:</span>
				{item.tanggal_mulai} → {item.tanggal_berakhir}
			</p>
			<p><span class="text-muted">SKU:</span> {item.kode_barang ?? 'Semua'}</p>
			<p><span class="text-muted">Min qty / amount:</span> {item.min_qty} / {formatRupiah(item.min_amount)}</p>
			{#if item.tipe_promo === 'buy_x_get_y'}
				<p><span class="text-muted">Beli/gratis:</span> {item.buy_qty} / {item.get_qty}</p>
			{:else if item.tipe_promo === 'bonus_qty'}
				<p><span class="text-muted">Bonus qty:</span> {item.bonus_qty}</p>
			{:else if item.tipe_promo === 'percentage_discount'}
				<p><span class="text-muted">Diskon:</span> {item.discount_percentage}%</p>
			{:else if item.tipe_promo === 'fixed_discount'}
				<p><span class="text-muted">Diskon:</span> {formatRupiah(item.discount_amount)}</p>
			{/if}
			{#if item.max_applications}
				<p><span class="text-muted">Max applications:</span> {item.max_applications}</p>
			{/if}
			{#if item.deskripsi}
				<p class="mt-2">{item.deskripsi}</p>
			{/if}
		</section>

		{#if bisaKelola || bisaHapus}
			<div class="flex flex-wrap gap-2">
				{#if bisaKelola}
					<a
						href={resolveAppPath(`/promo/${item.id}/ubah`)}
						class="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white"
					>
						Ubah
					</a>
					<button
						type="button"
						class="rounded-lg border border-slate-300 px-4 py-2 text-sm"
						onclick={toggleAktif}
					>
						{item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
					</button>
				{/if}
				{#if bisaHapus}
					<button
						type="button"
						class="rounded-lg border border-red-300 px-4 py-2 text-sm text-bahaya"
						onclick={konfirmasiHapus}
					>
						Hapus
					</button>
				{/if}
			</div>
		{/if}
	{/if}
</div>
