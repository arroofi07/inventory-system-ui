<script lang="ts">
	import PelangganForm from '$lib/components/pelanggan/PelangganForm.svelte';
	import { buatPelanggan } from '$lib/api/pelanggan';
	import { ApiError } from '$lib/api/http';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { pergiKe, resolveAppPath } from '$lib/nav';
	import { onMount } from 'svelte';

	let errors = $state<Record<string, string>>({});

	onMount(() => {
		if (!auth.punyaIzin('pelanggan.buat')) {
			showToast('Tidak berwenang menambah pelanggan', 'bahaya');
			void pergiKe('/pelanggan');
		}
	});
</script>

<div class="space-y-4">
	<a href={resolveAppPath('/pelanggan')} class="text-sm text-brand-700 underline"
		>← Kembali ke daftar</a
	>
	<header>
		<h1 class="font-display text-2xl text-ink">Tambah pelanggan</h1>
		<p class="text-sm text-muted">
			Kode terisi otomatis saat mengetik nama (3 huruf awal tiap kata + 4 angka). Bisa diubah manual.
		</p>
	</header>

	<PelangganForm
		mode="buat"
		{errors}
		onsubmit={async (payload) => {
			errors = {};
			try {
				const res = await buatPelanggan(payload);
				showToast(`Pelanggan ${res.data.kode_pelanggan} dibuat`, 'sukses');
				await pergiKe(`/pelanggan/${res.data.id}`);
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
