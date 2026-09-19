<script lang="ts">
	import Modal from '$lib/components/feedback/Modal.svelte';
	import { ApiError, apiFetch } from '$lib/api/http';
	import { showToast } from '$lib/stores/toast.svelte';

	interface Props {
		open?: boolean;
		endpoint: string;
		judul?: string;
		onsukses?: () => void;
	}

	let {
		open = $bindable(false),
		endpoint,
		judul = 'Impor CSV',
		onsukses
	}: Props = $props();

	let file = $state<File | null>(null);
	let loading = $state(false);
	let galat = $state<{ field: string; message: string }[]>([]);

	async function kirim() {
		if (!file) {
			showToast('Pilih berkas CSV', 'bahaya');
			return;
		}
		loading = true;
		galat = [];
		try {
			const fd = new FormData();
			fd.append('file', file);
			const res = await apiFetch<{ data: { jumlah_baris: number } }>(endpoint, {
				method: 'POST',
				body: fd
			});
			showToast(`Impor berhasil: ${res.data.jumlah_baris} baris`, 'sukses');
			open = false;
			file = null;
			onsukses?.();
		} catch (e) {
			if (e instanceof ApiError) {
				galat = e.body.details ?? [];
				showToast(e.body.message, 'bahaya');
			} else {
				showToast('Gagal impor', 'bahaya');
			}
		} finally {
			loading = false;
		}
	}
</script>

<Modal bind:open title={judul}>
	<div class="space-y-3">
		<p class="text-sm text-muted">
			Semua baris harus valid. Bila ada galat, tidak ada data yang disimpan — perbaiki lalu unggah ulang.
		</p>
		<input
			type="file"
			accept=".csv,text/csv"
			class="block w-full text-sm"
			onchange={(e) => {
				const list = (e.currentTarget as HTMLInputElement).files;
				file = list?.[0] ?? null;
				galat = [];
			}}
		/>
		{#if galat.length > 0}
			<div class="max-h-48 overflow-y-auto rounded border border-red-200 bg-red-50 p-2 text-sm">
				<p class="mb-1 font-medium text-red-800">Galat ({galat.length})</p>
				<ul class="space-y-1">
					{#each galat as g, i (i)}
						<li class="text-red-900">
							<span class="font-mono text-xs">{g.field || '—'}</span>: {g.message}
						</li>
					{/each}
				</ul>
			</div>
		{/if}
		<div class="flex justify-end gap-2">
			<button
				type="button"
				class="rounded border border-slate-300 px-3 py-1.5 text-sm"
				onclick={() => (open = false)}
				disabled={loading}
			>
				Batal
			</button>
			<button
				type="button"
				class="rounded bg-brand-700 px-3 py-1.5 text-sm text-white disabled:opacity-50"
				onclick={() => void kirim()}
				disabled={loading || !file}
			>
				{loading ? 'Mengunggah…' : 'Unggah'}
			</button>
		</div>
	</div>
</Modal>
