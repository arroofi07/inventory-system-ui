<script lang="ts">
	import { page } from '$app/state';
	import Badge from '$lib/components/data/Badge.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
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
	<Button variant="link" class="h-auto p-0" href={resolveAppPath('/users')}>
		← Kembali ke daftar
	</Button>

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

		<Card.Root class="gap-0 border border-primary/20 bg-white p-4 shadow-none ring-0">
			<Card.Content class="space-y-1 p-0 text-sm">
				<p><span class="text-muted">HP:</span> {item.no_hp ?? '—'}</p>
				<p><span class="text-muted">KTP:</span> {item.no_ktp ?? '—'}</p>
				<p><span class="text-muted">Jenis kelamin:</span> {item.jenis_kelamin ?? '—'}</p>
				{#if item.alamat}
					<p class="mt-2"><span class="text-muted">Alamat:</span> {item.alamat}</p>
				{/if}
			</Card.Content>
		</Card.Root>

		{#if bisaKelola}
			<div class="flex flex-wrap gap-2">
				<Button href={resolveAppPath(`/users/${item.id}/ubah`)}>Ubah</Button>
				<Button variant="outline" type="button" onclick={toggleAktif}>
					{item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
				</Button>
				{#if bisaHapus}
					<Button variant="destructive" type="button" onclick={konfirmasiHapus}>Hapus</Button>
				{/if}
			</div>
		{/if}
	{/if}
</div>
