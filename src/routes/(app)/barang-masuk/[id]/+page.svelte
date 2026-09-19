<script lang="ts">
	import { page } from '$app/state';
	import {
		detailBarangMasuk,
		hapusBarangMasuk,
		type BarangMasuk
	} from '$lib/api/barang-masuk';
	import { ApiError } from '$lib/api/http';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { pergiKe, resolveAppPath } from '$lib/nav';
	import { formatRupiah } from '$lib/domain/format';

	let item = $state<BarangMasuk | null>(null);
	let loading = $state(true);
	let error = $state('');
	let menghapus = $state(false);

	const id = $derived(Number(page.params.id));
	const bisaHapus = $derived(auth.punyaIzin('barang_masuk.hapus'));

	$effect(() => {
		const currentId = id;
		if (!Number.isFinite(currentId) || currentId <= 0) {
			error = 'ID tidak valid';
			loading = false;
			return;
		}
		loading = true;
		error = '';
		void detailBarangMasuk(currentId)
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

	async function hapus() {
		if (!item || !bisaHapus || menghapus) return;
		if (!confirm(`Hapus penerimaan ${item.kode_barang} batch ${item.no_batch}?`)) return;
		menghapus = true;
		try {
			await hapusBarangMasuk(item.id);
			showToast('Penerimaan dihapus', 'sukses');
			await pergiKe('/barang-masuk');
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal hapus', 'bahaya');
		} finally {
			menghapus = false;
		}
	}
</script>

<div class="space-y-4">
	<a href={resolveAppPath('/barang-masuk')} class="text-sm text-brand-700 underline"
		>← Daftar barang masuk</a
	>

	{#if loading}
		<p class="text-sm text-muted">Memuat…</p>
	{:else if error}
		<p class="text-sm text-bahaya">{error}</p>
	{:else if item}
		<header>
			<p class="font-mono text-sm text-muted">{item.kode_barang} · {item.no_batch}</p>
			<h1 class="font-display text-2xl text-ink">{item.nama_item}</h1>
			<p class="text-sm text-muted">
				Faktur {item.no_faktur} · masuk {item.tanggal_masuk} · exp {item.exp}
			</p>
		</header>

		<section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			<div class="rounded-[var(--radius-card)] border border-slate-200 bg-white p-4">
				<p class="text-xs uppercase text-muted">Qty / tersedia</p>
				<p class="font-display text-2xl tabular-nums">{item.qty} / {item.qty_tersedia}</p>
			</div>
			<div class="rounded-[var(--radius-card)] border border-slate-200 bg-white p-4">
				<p class="text-xs uppercase text-muted">HPP</p>
				<p class="text-lg tabular-nums">{formatRupiah(item.hpp)}</p>
				<p class="text-xs text-muted">+PPN {formatRupiah(item.hpp_dengan_ppn)}</p>
			</div>
			<div class="rounded-[var(--radius-card)] border border-slate-200 bg-white p-4">
				<p class="text-xs uppercase text-muted">Harga MT</p>
				<p class="text-lg tabular-nums">{formatRupiah(item.harga_mt)}</p>
			</div>
			<div class="rounded-[var(--radius-card)] border border-slate-200 bg-white p-4">
				<p class="text-xs uppercase text-muted">Harga GT</p>
				<p class="text-lg tabular-nums">{formatRupiah(item.harga_gt)}</p>
			</div>
		</section>

		<section class="rounded-[var(--radius-card)] border border-slate-200 bg-white p-4 text-sm">
			<p><span class="text-muted">Harga list:</span> {formatRupiah(item.harga)}</p>
			<p>
				<span class="text-muted">Disc HPP:</span>
				{item.disc_hpp_1}% / {item.disc_hpp_2}% / {item.disc_hpp_3}%
			</p>
			<p>
				<span class="text-muted">Markup MT/GT:</span>
				{item.markup_mt_type} {item.markup_mt_amount} · {item.markup_gt_type}
				{item.markup_gt_amount}
			</p>
		</section>

		{#if bisaHapus}
			<button
				type="button"
				class="rounded-lg border border-bahaya px-4 py-2 text-sm text-bahaya hover:bg-red-50 disabled:opacity-50"
				disabled={menghapus}
				onclick={() => void hapus()}
			>
				{menghapus ? 'Menghapus…' : 'Hapus penerimaan'}
			</button>
		{/if}
	{/if}
</div>
