<script lang="ts">
	import Field from '$lib/components/form/Field.svelte';
	import Combobox from '$lib/components/form/Combobox.svelte';
	import { USER_FORM_ROLES, type UserCreateBody } from '$lib/api/users';

	interface Props {
		mode: 'buat' | 'ubah';
		name?: string;
		email?: string;
		password?: string;
		role?: string;
		noHp?: string;
		noKtp?: string;
		alamat?: string;
		jenisKelamin?: string;
		/** Sembunyikan pilihan role bila user bukan sales/afiliasi. */
		roleTerkunci?: boolean;
		disabled?: boolean;
		errors?: Record<string, string>;
		onsubmit: (payload: UserCreateBody & { password?: string }) => void | Promise<void>;
	}

	let {
		mode,
		name = $bindable(''),
		email = $bindable(''),
		password = $bindable(''),
		role = $bindable('sales'),
		noHp = $bindable(''),
		noKtp = $bindable(''),
		alamat = $bindable(''),
		jenisKelamin = $bindable(''),
		roleTerkunci = false,
		disabled = false,
		errors = {},
		onsubmit
	}: Props = $props();

	let menyimpan = $state(false);

	const roleOpts = USER_FORM_ROLES.map((o) => ({ value: o.value, label: o.label }));
	const jkOpts = [
		{ value: '', label: '—' },
		{ value: 'L', label: 'Laki-laki' },
		{ value: 'P', label: 'Perempuan' }
	];

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (menyimpan || disabled) return;
		menyimpan = true;
		try {
			const base = {
				name: name.trim(),
				email: email.trim(),
				role: (role === 'afiliasi' ? 'afiliasi' : 'sales') as 'sales' | 'afiliasi',
				no_hp: noHp.trim() || null,
				no_ktp: noKtp.trim() || null,
				alamat: alamat.trim() || null,
				jenis_kelamin: (jenisKelamin === 'L' || jenisKelamin === 'P'
					? jenisKelamin
					: null) as 'L' | 'P' | null
			};
			const payload: Omit<UserCreateBody, 'password'> & { password?: string } =
				mode === 'ubah' && !password.trim()
					? base
					: { ...base, password };
			await onsubmit(payload as UserCreateBody & { password?: string });
		} finally {
			menyimpan = false;
		}
	}
</script>

<form class="grid max-w-xl gap-4" onsubmit={handleSubmit}>
	<Field label="Nama" required forId="name" error={errors.name}>
		<input
			id="name"
			class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
			bind:value={name}
			disabled={disabled || menyimpan}
			required
			maxlength={255}
		/>
	</Field>
	<Field label="Email" required forId="email" error={errors.email}>
		<input
			id="email"
			type="email"
			class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
			bind:value={email}
			disabled={disabled || menyimpan}
			required
			maxlength={255}
		/>
	</Field>
	<Field
		label={mode === 'buat' ? 'Password' : 'Password baru (opsional)'}
		required={mode === 'buat'}
		forId="password"
		error={errors.password}
	>
		<input
			id="password"
			type="password"
			class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
			bind:value={password}
			disabled={disabled || menyimpan}
			required={mode === 'buat'}
			minlength={mode === 'buat' ? 8 : undefined}
			autocomplete={mode === 'buat' ? 'new-password' : 'new-password'}
		/>
	</Field>
	{#if !roleTerkunci}
		<Field label="Role" required forId="role" error={errors.role}>
			<Combobox id="role" options={roleOpts} bind:value={role} disabled={disabled || menyimpan} />
			<p class="mt-1 text-xs text-muted">Hanya sales atau afiliasi.</p>
		</Field>
	{:else}
		<Field label="Role" forId="role-locked">
			<input
				id="role-locked"
				class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
				value={role}
				disabled
			/>
			<p class="mt-1 text-xs text-muted">Role admin/super_admin tidak diubah lewat form ini.</p>
		</Field>
	{/if}
	<Field label="No. HP" forId="hp" error={errors.no_hp}>
		<input
			id="hp"
			class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
			bind:value={noHp}
			disabled={disabled || menyimpan}
			maxlength={30}
		/>
	</Field>
	<Field label="No. KTP" forId="ktp" error={errors.no_ktp}>
		<input
			id="ktp"
			class="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
			bind:value={noKtp}
			disabled={disabled || menyimpan}
			maxlength={32}
		/>
	</Field>
	<Field label="Jenis kelamin" forId="jk" error={errors.jenis_kelamin}>
		<Combobox id="jk" options={jkOpts} bind:value={jenisKelamin} disabled={disabled || menyimpan} />
	</Field>
	<Field label="Alamat" forId="alamat" error={errors.alamat}>
		<textarea
			id="alamat"
			class="min-h-[72px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
			bind:value={alamat}
			disabled={disabled || menyimpan}
		></textarea>
	</Field>
	<button
		type="submit"
		class="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
		disabled={disabled || menyimpan}
	>
		{menyimpan ? 'Menyimpan…' : mode === 'buat' ? 'Simpan pengguna' : 'Simpan perubahan'}
	</button>
</form>
