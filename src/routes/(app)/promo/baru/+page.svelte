<script lang="ts">
	import PromoForm from '$lib/components/promo/PromoForm.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
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
	<Button variant="link" class="h-auto p-0" href={resolveAppPath('/promo')}>
		← Kembali ke daftar
	</Button>
	<header>
		<h1 class="font-display text-2xl text-ink">Tambah promo</h1>
		<p class="text-sm text-muted">Kode kosong → generate otomatis PROMO+YYYYMM+####.</p>
	</header>

	<Card.Root class="gap-0 border border-primary/20 bg-white p-4 shadow-none ring-0">
		<Card.Content class="p-0">
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
		</Card.Content>
	</Card.Root>
</div>
