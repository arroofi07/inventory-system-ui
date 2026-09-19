<script lang="ts">
	import PromoForm from '$lib/components/promo/PromoForm.svelte';
	import { buatPromo } from '$lib/api/promo';
	import { ApiError } from '$lib/api/http';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { pergiKe, resolveAppPath } from '$lib/nav';
	import { onMount } from 'svelte';

	let errors = $state<Record<string, string>>({});

	onMount(() => {
		if (!auth.punyaIzin('promo.kelola')) {
			showToast('Tidak berwenang menambah promo', 'bahaya');
			void pergiKe('/promo');
		}
	});
</script>

<div class="space-y-4">
	<a href={resolveAppPath('/promo')} class="text-sm text-brand-700 underline">← Kembali ke daftar</a>
	<header>
		<h1 class="font-display text-2xl text-ink">Tambah promo</h1>
		<p class="text-sm text-muted">Kode kosong → generate otomatis PROMO+YYYYMM+####.</p>
	</header>

	<PromoForm
		mode="buat"
		{errors}
		onsubmit={async (payload) => {
			errors = {};
			try {
				const res = await buatPromo(payload);
				showToast(`Promo ${res.data.kode_promo} dibuat`, 'sukses');
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
</div>
