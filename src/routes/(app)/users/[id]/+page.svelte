<script lang="ts">
	import { page } from '$app/state';
	import Badge from '$lib/components/data/Badge.svelte';
	import { detailUser, hapusUser, setStatusUser, type User } from '$lib/api/users';
	import { ApiError } from '$lib/api/http';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { pergiKe, resolveAppPath } from '$lib/nav';

	let item = $state<User | null>(null);
	let loading = $state(true);
	let error = $state('');

	const id = $derived(Number(page.params.id));
	const bisaKelola = $derived(auth.punyaIzin('user.kelola'));
	const bisaHapus = $derived(
		bisaKelola && item && item.role !== 'admin' && item.id !== auth.user?.id
	);

	$effect(() => {
		const currentId = id;
		if (!Number.isFinite(currentId) || currentId <= 0) {
			error = 'ID tidak valid';
			loading = false;
			return;
		}
		loading = true;
		error = '';
		void detailUser(currentId)
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
			const res = await setStatusUser(item.id, !item.is_active);
			item = res.data;
			showToast(item.is_active ? 'Pengguna diaktifkan' : 'Pengguna dinonaktifkan', 'sukses');
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal ubah status', 'bahaya');
		}
	}

	async function konfirmasiHapus() {
		if (!item || !bisaHapus) return;
		if (!confirm(`Hapus pengguna ${item.email}?`)) return;
		try {
			await hapusUser(item.id);
			showToast('Pengguna dihapus', 'sukses');
			await pergiKe('/users');
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal menghapus', 'bahaya');
		}
	}
</script>

<div class="space-y-4">
	<a href={resolveAppPath('/users')} class="text-sm text-brand-700 underline">← Kembali ke daftar</a>

	{#if loading}
		<p class="text-sm text-muted">Memuat…</p>
	{:else if error}
		<p class="text-sm text-bahaya">{error}</p>
	{:else if item}
		<header class="flex flex-wrap items-start justify-between gap-3">
			<div>
				<h1 class="font-display text-2xl text-ink">{item.name}</h1>
				<p class="font-mono text-sm text-muted">{item.email}</p>
				<p class="text-sm text-muted">{item.role}</p>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				{#if item.is_active}
					<Badge tone="sukses" label="Aktif" />
				{:else}
					<Badge tone="netral" label="Nonaktif" />
				{/if}
				{#if item.role === 'admin'}
					<Badge tone="info" label="Tidak dapat dihapus" />
				{/if}
			</div>
		</header>

		<section class="rounded-[var(--radius-card)] border border-slate-200 bg-white p-4 text-sm">
			<p><span class="text-muted">HP:</span> {item.no_hp ?? '—'}</p>
			<p><span class="text-muted">KTP:</span> {item.no_ktp ?? '—'}</p>
			<p><span class="text-muted">Jenis kelamin:</span> {item.jenis_kelamin ?? '—'}</p>
			{#if item.alamat}
				<p class="mt-2"><span class="text-muted">Alamat:</span> {item.alamat}</p>
			{/if}
		</section>

		{#if bisaKelola}
			<div class="flex flex-wrap gap-2">
				<a
					href={resolveAppPath(`/users/${item.id}/ubah`)}
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
