<script lang="ts">
	import BarangForm from '$lib/components/barang/BarangForm.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { buatBarang, pathTambahBarang } from '$lib/api/barang';
	import { ApiError } from '$lib/api/http';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { pergiKe, resolveAppPath } from '$lib/nav';
	import { onMount } from 'svelte';

	let errors = $state<Record<string, string>>({});

	onMount(() => {
		if (!auth.punyaIzin('barang.kelola')) {
			showToast('Tidak berwenang menambah barang', 'bahaya');
			void pergiKe('/barang');
		}
	});
</script>

<div class="space-y-4">
	<Button variant="link" class="h-auto p-0" href={resolveAppPath('/barang')}>
		← Kembali ke daftar
	</Button>
	<header>
		<h1 class="font-display text-2xl text-ink">SKU tanpa stok</h1>
		<p class="text-sm text-muted">
			Master SKU tanpa penerimaan.
			{#if auth.punyaIzin('barang_masuk.buat')}
				Untuk barang baru sekaligus stok, gunakan
				<Button
					variant="link"
					class="h-auto p-0"
					href={resolveAppPath(pathTambahBarang())}
				>
					Tambah barang
				</Button>.
			{/if}
		</p>
	</header>

	<BarangForm
		mode="buat"
		{errors}
		onsubmit={async (payload) => {
			errors = {};
			try {
				const res = await buatBarang(payload);
				showToast(`Barang ${res.data.kode_barang} dibuat`, 'sukses');
				await pergiKe(`/barang/${res.data.id}`);
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
