<script lang="ts">
	import Field from '$lib/components/form/Field.svelte';
	import CurrencyInput from '$lib/components/form/CurrencyInput.svelte';
	import Combobox from '$lib/components/form/Combobox.svelte';
	import {
		CHANNEL_OUTLET_OPTIONS,
		type ChannelOutlet,
		type PelangganCreateBody
	} from '$lib/api/pelanggan';

	interface Props {
		mode: 'buat' | 'ubah';
		kodePelanggan?: string;
		namaPelanggan?: string;
		tglRegistrasi?: string;
		phone?: string;
		npwpNik?: string;
		namaPemilikNpwpNik?: string;
		alamatNpwpNik?: string;
		territory?: string;
		distrik?: string;
		alamatToko?: string;
		rtRw?: string;
		provinsi?: string;
		kabupaten?: string;
		kecamatan?: string;
		kelurahan?: string;
		kodePos?: string;
		channelOutlet?: string;
		alamatPengantaran?: string;
		jenisBangunan?: string;
		statusBangunan?: string;
		nominalPengambilanPertama?: string;
		estimasiBatasKredit?: string;
		kodeTerkunci?: boolean;
		disabled?: boolean;
		errors?: Record<string, string>;
		onsubmit: (payload: PelangganCreateBody) => void | Promise<void>;
	}

	let {
		mode,
		kodePelanggan = $bindable(''),
		namaPelanggan = $bindable(''),
		tglRegistrasi = $bindable(''),
		phone = $bindable(''),
		npwpNik = $bindable(''),
		namaPemilikNpwpNik = $bindable(''),
		alamatNpwpNik = $bindable(''),
		territory = $bindable(''),
		distrik = $bindable(''),
		alamatToko = $bindable(''),
		rtRw = $bindable(''),
		provinsi = $bindable(''),
		kabupaten = $bindable(''),
		kecamatan = $bindable(''),
		kelurahan = $bindable(''),
		kodePos = $bindable(''),
		channelOutlet = $bindable('General Trade'),
		alamatPengantaran = $bindable(''),
		jenisBangunan = $bindable(''),
		statusBangunan = $bindable(''),
		nominalPengambilanPertama = $bindable('0'),
		estimasiBatasKredit = $bindable('0'),
		kodeTerkunci = false,
		disabled = false,
		errors = {},
		onsubmit
	}: Props = $props();

	let menyimpan = $state(false);

	const channelOpts = CHANNEL_OUTLET_OPTIONS.map((o) => ({ value: o.value, label: o.label }));

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (menyimpan || disabled) return;
		menyimpan = true;
		try {
			await onsubmit({
				kode_pelanggan: kodePelanggan.trim(),
				nama_pelanggan: namaPelanggan.trim(),
				tgl_registrasi: tglRegistrasi.trim(),
				phone: phone.trim(),
				npwp_nik: npwpNik.trim() || null,
				nama_pemilik_npwp_nik: namaPemilikNpwpNik.trim() || null,
				alamat_npwp_nik: alamatNpwpNik.trim() || null,
				territory: territory.trim(),
				distrik: distrik.trim(),
				alamat_toko: alamatToko.trim(),
				rt_rw: rtRw.trim() || null,
				provinsi: provinsi.trim(),
				kabupaten: kabupaten.trim(),
				kecamatan: kecamatan.trim(),
				kelurahan: kelurahan.trim(),
				kode_pos: kodePos.trim() || null,
				channel_outlet: channelOutlet as ChannelOutlet,
				alamat_pengantaran_barang: alamatPengantaran.trim() || null,
				jenis_bangunan: jenisBangunan.trim() || null,
				status_bangunan: statusBangunan.trim() || null,
				nominal_pengambilan_pertama: nominalPengambilanPertama || '0',
				estimasi_batas_kredit: estimasiBatasKredit || '0'
			});
		} finally {
			menyimpan = false;
		}
	}
</script>

<form class="grid max-w-3xl gap-6" onsubmit={handleSubmit}>
	<section class="grid gap-4 sm:grid-cols-2">
		<h2 class="sm:col-span-2 font-display text-lg text-ink">Identitas</h2>
		<Field label="Kode pelanggan" required forId="kode" error={errors.kode_pelanggan}>
			<input
				id="kode"
				class="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm disabled:bg-slate-50"
				bind:value={kodePelanggan}
				disabled={kodeTerkunci || disabled || menyimpan}
				required
				maxlength={32}
			/>
			{#if kodeTerkunci}
				<p class="mt-1 text-xs text-muted">Kode terkunci karena sudah punya transaksi.</p>
			{/if}
		</Field>
		<Field label="Nama pelanggan" required forId="nama" error={errors.nama_pelanggan}>
			<input
				id="nama"
				class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
				bind:value={namaPelanggan}
				disabled={disabled || menyimpan}
				required
				maxlength={255}
			/>
		</Field>
		<Field label="Tanggal registrasi" required forId="tgl" error={errors.tgl_registrasi}>
			<input
				id="tgl"
				type="date"
				class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
				bind:value={tglRegistrasi}
				disabled={disabled || menyimpan}
				required
			/>
		</Field>
		<Field label="Telepon" required forId="phone" error={errors.phone}>
			<input
				id="phone"
				class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
				bind:value={phone}
				disabled={disabled || menyimpan}
				required
				maxlength={30}
			/>
		</Field>
		<Field label="Channel outlet" required forId="channel" error={errors.channel_outlet}>
			<Combobox
				id="channel"
				options={channelOpts}
				bind:value={channelOutlet}
				disabled={disabled || menyimpan}
			/>
		</Field>
	</section>

	<section class="grid gap-4 sm:grid-cols-2">
		<h2 class="sm:col-span-2 font-display text-lg text-ink">Wilayah & alamat</h2>
		<Field label="Territory" required forId="territory" error={errors.territory}>
			<input
				id="territory"
				class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
				bind:value={territory}
				disabled={disabled || menyimpan}
				required
			/>
		</Field>
		<Field label="Distrik" required forId="distrik" error={errors.distrik}>
			<input
				id="distrik"
				class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
				bind:value={distrik}
				disabled={disabled || menyimpan}
				required
			/>
		</Field>
		<Field label="Alamat toko" required forId="alamat" error={errors.alamat_toko}>
			<textarea
				id="alamat"
				class="min-h-[72px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
				bind:value={alamatToko}
				disabled={disabled || menyimpan}
				required
			></textarea>
		</Field>
		<Field label="RT/RW" forId="rtrw" error={errors.rt_rw}>
			<input
				id="rtrw"
				class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
				bind:value={rtRw}
				disabled={disabled || menyimpan}
				maxlength={20}
			/>
		</Field>
		<Field label="Provinsi" required forId="provinsi" error={errors.provinsi}>
			<input
				id="provinsi"
				class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
				bind:value={provinsi}
				disabled={disabled || menyimpan}
				required
			/>
		</Field>
		<Field label="Kabupaten" required forId="kabupaten" error={errors.kabupaten}>
			<input
				id="kabupaten"
				class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
				bind:value={kabupaten}
				disabled={disabled || menyimpan}
				required
			/>
		</Field>
		<Field label="Kecamatan" required forId="kecamatan" error={errors.kecamatan}>
			<input
				id="kecamatan"
				class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
				bind:value={kecamatan}
				disabled={disabled || menyimpan}
				required
			/>
		</Field>
		<Field label="Kelurahan" required forId="kelurahan" error={errors.kelurahan}>
			<input
				id="kelurahan"
				class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
				bind:value={kelurahan}
				disabled={disabled || menyimpan}
				required
			/>
		</Field>
		<Field label="Kode pos" forId="kodepos" error={errors.kode_pos}>
			<input
				id="kodepos"
				class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
				bind:value={kodePos}
				disabled={disabled || menyimpan}
				maxlength={10}
			/>
		</Field>
		<Field label="Alamat pengantaran" forId="antar" error={errors.alamat_pengantaran_barang}>
			<textarea
				id="antar"
				class="min-h-[56px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
				bind:value={alamatPengantaran}
				disabled={disabled || menyimpan}
			></textarea>
		</Field>
	</section>

	<section class="grid gap-4 sm:grid-cols-2">
		<h2 class="sm:col-span-2 font-display text-lg text-ink">Pajak & kredit (opsional)</h2>
		<Field label="NPWP / NIK" forId="npwp" error={errors.npwp_nik}>
			<input
				id="npwp"
				class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
				bind:value={npwpNik}
				disabled={disabled || menyimpan}
				maxlength={32}
			/>
		</Field>
		<Field label="Nama pemilik NPWP/NIK" forId="pemilik" error={errors.nama_pemilik_npwp_nik}>
			<input
				id="pemilik"
				class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
				bind:value={namaPemilikNpwpNik}
				disabled={disabled || menyimpan}
			/>
		</Field>
		<Field label="Alamat NPWP/NIK" forId="alamat-npwp" error={errors.alamat_npwp_nik}>
			<textarea
				id="alamat-npwp"
				class="min-h-[56px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
				bind:value={alamatNpwpNik}
				disabled={disabled || menyimpan}
			></textarea>
		</Field>
		<Field label="Jenis bangunan" forId="jenis" error={errors.jenis_bangunan}>
			<input
				id="jenis"
				class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
				bind:value={jenisBangunan}
				disabled={disabled || menyimpan}
			/>
		</Field>
		<Field label="Status bangunan" forId="status-bang" error={errors.status_bangunan}>
			<input
				id="status-bang"
				class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
				bind:value={statusBangunan}
				disabled={disabled || menyimpan}
			/>
		</Field>
		<Field
			label="Nominal pengambilan pertama"
			forId="nominal"
			error={errors.nominal_pengambilan_pertama}
		>
			<CurrencyInput id="nominal" bind:value={nominalPengambilanPertama} disabled={disabled || menyimpan} />
		</Field>
		<Field label="Estimasi batas kredit" forId="kredit" error={errors.estimasi_batas_kredit}>
			<CurrencyInput id="kredit" bind:value={estimasiBatasKredit} disabled={disabled || menyimpan} />
		</Field>
	</section>

	<div class="flex gap-2">
		<button
			type="submit"
			class="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
			disabled={disabled || menyimpan}
		>
			{menyimpan ? 'Menyimpan…' : mode === 'buat' ? 'Simpan pelanggan' : 'Simpan perubahan'}
		</button>
	</div>
</form>
