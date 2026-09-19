<script lang="ts">
	import { page } from '$app/state';
	import BarangForm from '$lib/components/barang/BarangForm.svelte';
	import { detailBarang, ubahBarang } from '$lib/api/barang';
	import { ApiError } from '$lib/api/http';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { pergiKe, resolveAppPath } from '$lib/nav';

	let loading = $state(true);
	let errors = $state<Record<string, string>>({});
	let kodeBarang = $state('');
	let namaItem = $state('');
	let brand = $state('');
	let satuan = $state('PCS');
	let minStock = $state(0);
	let reorderPoint = $state(0);
	let expiryAlertDays = $state(30);

	const id = $derived(Number(page.params.id));

	$effect(() => {
		if (!auth.punyaIzin('barang.kelola')) {
			showToast('Tidak berwenang mengubah barang', 'bahaya');
			void pergiKe('/barang');
			return;
		}
		const currentId = id;
		if (!Number.isFinite(currentId) || currentId <= 0) return;
		loading = true;
		void detailBarang(currentId)
			.then((res) => {
				const b = res.data;
				kodeBarang = b.kode_barang;
				namaItem = b.nama_item;
				brand = b.brand;
				satuan = b.satuan;
				minStock = b.min_stock;
				reorderPoint = b.reorder_point;
				expiryAlertDays = b.expiry_alert_days;
			})
			.catch((e) => {
				showToast(e instanceof ApiError ? e.body.message : 'Gagal memuat', 'bahaya');
				void pergiKe('/barang');
			})
			.finally(() => {
				loading = false;
			});
	});
</script>

<div class="space-y-4">
	<a href={resolveAppPath(`/barang/${id}`)} class="text-sm text-brand-700 underline"
		>← Kembali ke detail</a
	>
	<header>
		<h1 class="font-display text-2xl text-ink">Ubah barang</h1>
		<p class="text-sm text-muted">Kode tidak dapat diubah.</p>
	</header>

	{#if loading}
		<p class="text-sm text-muted">Memuat…</p>
	{:else}
		<BarangForm
			mode="ubah"
			bind:kodeBarang
			bind:namaItem
			bind:brand
			bind:satuan
			bind:minStock
			bind:reorderPoint
			bind:expiryAlertDays
			{errors}
			onsubmit={async (payload) => {
				errors = {};
				try {
					const res = await ubahBarang(id, {
						nama_item: payload.nama_item,
						brand: payload.brand,
						satuan: payload.satuan,
						min_stock: payload.min_stock,
						reorder_point: payload.reorder_point,
						metode_alokasi: payload.metode_alokasi,
						expiry_alert_days: payload.expiry_alert_days
					});
					showToast('Perubahan disimpan', 'sukses');
					await pergiKe(`/barang/${res.data.id}`);
				} catch (e) {
					if (e instanceof ApiError) {
						showToast(e.body.message, 'bahaya');
						return;
					}
					showToast('Gagal menyimpan', 'bahaya');
				}
			}}
		/>
	{/if}
</div>
