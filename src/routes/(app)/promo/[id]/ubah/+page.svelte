<script lang="ts">
	import { page } from '$app/state';
	import PromoForm from '$lib/components/promo/PromoForm.svelte';
	import { detailPromo, ubahPromo } from '$lib/api/promo';
	import { ApiError } from '$lib/api/http';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { pergiKe, resolveAppPath } from '$lib/nav';

	let loading = $state(true);
	let errors = $state<Record<string, string>>({});
	let kodePromo = $state('');
	let namaPromo = $state('');
	let deskripsi = $state('');
	let tipePromo = $state('percentage_discount');
	let buyQty = $state(1);
	let getQty = $state(1);
	let bonusQty = $state(1);
	let discountPercentage = $state('10');
	let discountAmount = $state('1000');
	let minQty = $state(1);
	let minAmount = $state('0');
	let maxApplications = $state('');
	let kodeBarang = $state('');
	let tanggalMulai = $state('');
	let tanggalBerakhir = $state('');
	let syaratKetentuan = $state('');

	const id = $derived(Number(page.params.id));

	$effect(() => {
		if (!auth.punyaIzin('promo.kelola')) {
			showToast('Tidak berwenang mengubah promo', 'bahaya');
			void pergiKe('/promo');
			return;
		}
		const currentId = id;
		if (!Number.isFinite(currentId) || currentId <= 0) return;
		loading = true;
		void detailPromo(currentId)
			.then((res) => {
				const p = res.data;
				kodePromo = p.kode_promo;
				namaPromo = p.nama_promo;
				deskripsi = p.deskripsi ?? '';
				tipePromo = p.tipe_promo;
				buyQty = p.buy_qty ?? 1;
				getQty = p.get_qty ?? 1;
				bonusQty = p.bonus_qty || 1;
				discountPercentage = p.discount_percentage;
				discountAmount = p.discount_amount;
				minQty = p.min_qty;
				minAmount = p.min_amount;
				maxApplications = p.max_applications != null ? String(p.max_applications) : '';
				kodeBarang = p.kode_barang ?? '';
				tanggalMulai = p.tanggal_mulai;
				tanggalBerakhir = p.tanggal_berakhir;
				syaratKetentuan = p.syarat_ketentuan ?? '';
			})
			.catch((e) => {
				showToast(e instanceof ApiError ? e.body.message : 'Gagal memuat', 'bahaya');
				void pergiKe('/promo');
			})
			.finally(() => {
				loading = false;
			});
	});
</script>

<div class="space-y-4">
	<a href={resolveAppPath(`/promo/${id}`)} class="text-sm text-brand-700 underline"
		>← Kembali ke detail</a
	>
	<header>
		<h1 class="font-display text-2xl text-ink">Ubah promo</h1>
		<p class="font-mono text-sm text-muted">{kodePromo}</p>
	</header>

	{#if loading}
		<p class="text-sm text-muted">Memuat…</p>
	{:else}
		<PromoForm
			mode="ubah"
			bind:namaPromo
			bind:deskripsi
			bind:tipePromo
			bind:buyQty
			bind:getQty
			bind:bonusQty
			bind:discountPercentage
			bind:discountAmount
			bind:minQty
			bind:minAmount
			bind:maxApplications
			bind:kodeBarang
			bind:tanggalMulai
			bind:tanggalBerakhir
			bind:syaratKetentuan
			{errors}
			onsubmit={async (payload) => {
				errors = {};
				try {
					const res = await ubahPromo(id, payload);
					showToast('Perubahan disimpan', 'sukses');
					await pergiKe(`/promo/${res.data.id}`);
				} catch (e) {
					if (e instanceof ApiError) {
						if (e.body.details?.length) {
							const next: Record<string, string> = {};
							for (const d of e.body.details) next[d.field] = d.message;
							errors = next;
						}
						showToast(e.body.message, 'bahaya');
						return;
					}
					showToast('Gagal menyimpan', 'bahaya');
				}
			}}
		/>
	{/if}
</div>
