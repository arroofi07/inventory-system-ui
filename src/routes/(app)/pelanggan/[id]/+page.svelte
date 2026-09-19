<script lang="ts">
	import { page } from '$app/state';
	import Badge from '$lib/components/data/Badge.svelte';
	import { detailPelanggan, setStatusPelanggan, type Pelanggan } from '$lib/api/pelanggan';
	import { ApiError } from '$lib/api/http';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { resolveAppPath } from '$lib/nav';
	import { formatRupiah } from '$lib/domain/format';

	let item = $state<Pelanggan | null>(null);
	let loading = $state(true);
	let error = $state('');

	const key = $derived(page.params.id ?? '');
	const bisaUbah = $derived(auth.punyaIzin('pelanggan.ubah'));

	$effect(() => {
		const current = key;
		if (!current) {
			error = 'ID tidak valid';
			loading = false;
			return;
		}
		loading = true;
		error = '';
		void detailPelanggan(current)
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
		if (!item || !bisaUbah) return;
		try {
			const res = await setStatusPelanggan(item.id, !item.is_active);
			item = res.data;
			showToast(
				item.is_active
					? 'Pelanggan diaktifkan kembali'
					: 'Pelanggan dinonaktifkan (hilang dari search)',
				'sukses'
			);
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal ubah status', 'bahaya');
		}
	}
</script>

<div class="space-y-4">
	<a href={resolveAppPath('/pelanggan')} class="text-sm text-brand-700 underline"
		>← Kembali ke daftar</a
	>

	{#if loading}
		<p class="text-sm text-muted">Memuat…</p>
	{:else if error}
		<p class="text-sm text-bahaya">{error}</p>
	{:else if item}
		<header class="flex flex-wrap items-start justify-between gap-3">
			<div>
				<p class="font-mono text-sm text-muted">{item.kode_pelanggan}</p>
				<h1 class="font-display text-2xl text-ink">{item.nama_pelanggan}</h1>
				<p class="text-sm text-muted">{item.channel_outlet} · {item.territory} / {item.distrik}</p>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				{#if item.is_active}
					<Badge tone="sukses" label="Aktif" />
				{:else}
					<Badge tone="netral" label="Nonaktif" />
				{/if}
				{#if item.punya_transaksi}
					<Badge tone="info" label="Punya transaksi" />
				{/if}
			</div>
		</header>

		<section class="grid gap-3 sm:grid-cols-2">
			<div class="rounded-[var(--radius-card)] border border-slate-200 bg-white p-4 text-sm">
				<p><span class="text-muted">Telepon:</span> {item.phone}</p>
				<p><span class="text-muted">Registrasi:</span> {item.tgl_registrasi}</p>
				<p class="mt-2"><span class="text-muted">Alamat toko:</span></p>
				<p>{item.alamat_toko}</p>
				<p class="mt-2 text-muted">
					{item.kelurahan}, {item.kecamatan}, {item.kabupaten}, {item.provinsi}
					{#if item.kode_pos}
						({item.kode_pos})
					{/if}
				</p>
			</div>
			<div class="rounded-[var(--radius-card)] border border-slate-200 bg-white p-4 text-sm">
				<p>
					<span class="text-muted">Pengambilan pertama:</span>
					{formatRupiah(item.nominal_pengambilan_pertama)}
				</p>
				<p>
					<span class="text-muted">Batas kredit:</span>
					{formatRupiah(item.estimasi_batas_kredit)}
				</p>
				{#if item.npwp_nik}
					<p class="mt-2"><span class="text-muted">NPWP/NIK:</span> {item.npwp_nik}</p>
				{/if}
			</div>
		</section>

		<div class="flex flex-wrap gap-2">
			{#if bisaUbah}
				<a
					href={resolveAppPath(`/pelanggan/${item.id}/ubah`)}
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
		</div>
	{/if}
</div>
