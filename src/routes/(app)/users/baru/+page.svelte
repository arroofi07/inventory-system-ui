<script lang="ts">
	import UserForm from '$lib/components/users/UserForm.svelte';
	import { buatUser } from '$lib/api/users';
	import { ApiError } from '$lib/api/http';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { pergiKe, resolveAppPath } from '$lib/nav';
	import { onMount } from 'svelte';

	let errors = $state<Record<string, string>>({});

	onMount(() => {
		if (!auth.punyaIzin('user.kelola')) {
			showToast('Tidak berwenang menambah pengguna', 'bahaya');
			void pergiKe('/users');
		}
	});
</script>

<div class="space-y-4">
	<a href={resolveAppPath('/users')} class="text-sm text-brand-700 underline">← Kembali ke daftar</a>
	<header>
		<h1 class="font-display text-2xl text-ink">Tambah pengguna</h1>
		<p class="text-sm text-muted">Role hanya sales atau afiliasi. Tanpa reset password / 2FA.</p>
	</header>

	<UserForm
		mode="buat"
		{errors}
		onsubmit={async (payload) => {
			errors = {};
			try {
				if (!payload.password) {
					errors = { password: 'wajib diisi' };
					return;
				}
				const res = await buatUser({
					name: payload.name,
					email: payload.email,
					password: payload.password,
					role: payload.role,
					no_hp: payload.no_hp,
					no_ktp: payload.no_ktp,
					alamat: payload.alamat,
					jenis_kelamin: payload.jenis_kelamin
				});
				showToast(`Pengguna ${res.data.email} dibuat`, 'sukses');
				await pergiKe(`/users/${res.data.id}`);
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
