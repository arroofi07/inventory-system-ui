<script lang="ts">
	import { page } from '$app/state';
	import UserForm from '$lib/components/users/UserForm.svelte';
	import { detailUser, ubahUser } from '$lib/api/users';
	import { ApiError } from '$lib/api/http';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { pergiKe, resolveAppPath } from '$lib/nav';

	let loading = $state(true);
	let errors = $state<Record<string, string>>({});
	let roleTerkunci = $state(false);
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let role = $state('sales');
	let noHp = $state('');
	let noKtp = $state('');
	let alamat = $state('');
	let jenisKelamin = $state('');

	const id = $derived(Number(page.params.id));

	$effect(() => {
		if (!auth.punyaIzin('user.kelola')) {
			showToast('Tidak berwenang mengubah pengguna', 'bahaya');
			void pergiKe('/users');
			return;
		}
		const currentId = id;
		if (!Number.isFinite(currentId) || currentId <= 0) return;
		loading = true;
		void detailUser(currentId)
			.then((res) => {
				const u = res.data;
				name = u.name;
				email = u.email;
				role = u.role;
				roleTerkunci = u.role === 'admin' || u.role === 'super_admin';
				noHp = u.no_hp ?? '';
				noKtp = u.no_ktp ?? '';
				alamat = u.alamat ?? '';
				jenisKelamin = u.jenis_kelamin ?? '';
				password = '';
			})
			.catch((e) => {
				showToast(e instanceof ApiError ? e.body.message : 'Gagal memuat', 'bahaya');
				void pergiKe('/users');
			})
			.finally(() => {
				loading = false;
			});
	});
</script>

<div class="space-y-4">
	<a href={resolveAppPath(`/users/${id}`)} class="text-sm text-brand-700 underline"
		>← Kembali ke detail</a
	>
	<header>
		<h1 class="font-display text-2xl text-ink">Ubah pengguna</h1>
		<p class="text-sm text-muted">Perubahan role mencabut refresh token.</p>
	</header>

	{#if loading}
		<p class="text-sm text-muted">Memuat…</p>
	{:else}
		<UserForm
			mode="ubah"
			bind:name
			bind:email
			bind:password
			bind:role
			bind:noHp
			bind:noKtp
			bind:alamat
			bind:jenisKelamin
			{roleTerkunci}
			{errors}
			onsubmit={async (payload) => {
				errors = {};
				try {
					const body: Parameters<typeof ubahUser>[1] = {
						name: payload.name,
						email: payload.email,
						no_hp: payload.no_hp,
						no_ktp: payload.no_ktp,
						alamat: payload.alamat,
						jenis_kelamin: payload.jenis_kelamin
					};
					if (!roleTerkunci) {
						body.role = payload.role;
					}
					if (payload.password) {
						body.password = payload.password;
					}
					const res = await ubahUser(id, body);
					showToast('Perubahan disimpan', 'sukses');
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
	{/if}
</div>
