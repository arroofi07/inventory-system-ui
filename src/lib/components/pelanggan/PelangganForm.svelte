<script lang="ts">
	import Field from '$lib/components/form/Field.svelte';
	import CurrencyInput from '$lib/components/form/CurrencyInput.svelte';
	import Combobox from '$lib/components/form/Combobox.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import {
		CHANNEL_OUTLET_OPTIONS,
		JENIS_BANGUNAN_OPTIONS,
		STATUS_BANGUNAN_OPTIONS,
		opsiDenganNilaiLama,
		type ChannelOutlet,
		type PelangganCreateBody
	} from '$lib/api/pelanggan';
	import {
		prefixKodePelangganDariNama,
		suffixKodePelangganAcak
	} from '$lib/domain/pelanggan';

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
	/** null = ikuti nama; string = override manual */
	let kodeManual: string | null = $state(null);
	let suffixAngka = $state('');
	let prefixTerakhir = $state('');

	const channelOpts = CHANNEL_OUTLET_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
	const jenisOpts = $derived([
		{ value: '', label: 'Pilih…' },
		...opsiDenganNilaiLama(JENIS_BANGUNAN_OPTIONS, jenisBangunan)
	]);
	const statusOpts = $derived([
		{ value: '', label: 'Pilih…' },
		...opsiDenganNilaiLama(STATUS_BANGUNAN_OPTIONS, statusBangunan)
	]);
	const jenisTriggerLabel = $derived(
		jenisOpts.find((o) => o.value === jenisBangunan)?.label ?? 'Pilih…'
	);
	const statusTriggerLabel = $derived(
		statusOpts.find((o) => o.value === statusBangunan)?.label ?? 'Pilih…'
	);

	const prefixOtomatis = $derived(prefixKodePelangganDariNama(namaPelanggan));

	$effect(() => {
		if (mode !== 'buat' || kodeManual !== null) return;
		const prefix = prefixOtomatis;
		if (!prefix) {
			suffixAngka = '';
			prefixTerakhir = '';
			return;
		}
		if (prefix !== prefixTerakhir) {
			suffixAngka = suffixKodePelangganAcak();
			prefixTerakhir = prefix;
		}
	});

	const kodeOtomatisDariNama = $derived(
		prefixOtomatis && suffixAngka ? `${prefixOtomatis}${suffixAngka}` : ''
	);
	const kodeBuat = $derived(kodeManual ?? kodeOtomatisDariNama);

	function handleKodeBuatInput(e: Event) {
		kodeManual = (e.currentTarget as HTMLInputElement).value;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (menyimpan || disabled) return;
		menyimpan = true;
		try {
			const payload: PelangganCreateBody = {
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
			};
			if (mode === 'buat') {
				const kode = kodeBuat.trim();
				if (kode) payload.kode_pelanggan = kode;
			} else {
				payload.kode_pelanggan = kodePelanggan.trim();
			}
			await onsubmit(payload);
		} finally {
			menyimpan = false;
		}
	}
</script>

<form class="grid max-w-3xl gap-6" onsubmit={handleSubmit}>
	<section class="grid gap-4 sm:grid-cols-2">
		<h2 class="sm:col-span-2 font-display text-lg text-ink">Identitas</h2>
		{#if mode === 'buat'}
			<Field label="Nama pelanggan" required forId="nama" error={errors.nama_pelanggan}>
				<Input
					id="nama"
					bind:value={namaPelanggan}
					disabled={disabled || menyimpan}
					required
					maxlength={255}
				/>
			</Field>
			<Field
				label="Kode pelanggan"
				forId="kode"
				error={errors.kode_pelanggan}
				hint="3 huruf awal tiap kata + 4 angka (contoh: Toko Budiman → TOKBUD5187). Bisa diubah manual."
			>
				<Input
					id="kode"
					class="font-mono"
					value={kodeBuat}
					oninput={handleKodeBuatInput}
					disabled={disabled || menyimpan}
					maxlength={32}
				/>
			</Field>
		{:else}
			<Field label="Kode pelanggan" required forId="kode" error={errors.kode_pelanggan}>
				<Input
					id="kode"
					class="font-mono"
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
				<Input
					id="nama"
					bind:value={namaPelanggan}
					disabled={disabled || menyimpan}
					required
					maxlength={255}
				/>
			</Field>
		{/if}
		<Field label="Tanggal registrasi" required forId="tgl" error={errors.tgl_registrasi}>
			<Input
				id="tgl"
				type="date"
				bind:value={tglRegistrasi}
				disabled={disabled || menyimpan}
				required
			/>
		</Field>
		<Field label="Telepon" required forId="phone" error={errors.phone}>
			<Input
				id="phone"
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
			<Input
				id="territory"
				bind:value={territory}
				disabled={disabled || menyimpan}
				required
			/>
		</Field>
		<Field label="Distrik" required forId="distrik" error={errors.distrik}>
			<Input
				id="distrik"
				bind:value={distrik}
				disabled={disabled || menyimpan}
				required
			/>
		</Field>
		<Field label="Alamat toko" required forId="alamat" error={errors.alamat_toko}>
			<Textarea
				id="alamat"
				class="min-h-18 sm:col-span-2"
				bind:value={alamatToko}
				disabled={disabled || menyimpan}
				required
			/>
		</Field>
		<Field label="RT/RW" forId="rtrw" error={errors.rt_rw}>
			<Input
				id="rtrw"
				bind:value={rtRw}
				disabled={disabled || menyimpan}
				maxlength={20}
			/>
		</Field>
		<Field label="Provinsi" required forId="provinsi" error={errors.provinsi}>
			<Input
				id="provinsi"
				bind:value={provinsi}
				disabled={disabled || menyimpan}
				required
			/>
		</Field>
		<Field label="Kabupaten" required forId="kabupaten" error={errors.kabupaten}>
			<Input
				id="kabupaten"
				bind:value={kabupaten}
				disabled={disabled || menyimpan}
				required
			/>
		</Field>
		<Field label="Kecamatan" required forId="kecamatan" error={errors.kecamatan}>
			<Input
				id="kecamatan"
				bind:value={kecamatan}
				disabled={disabled || menyimpan}
				required
			/>
		</Field>
		<Field label="Kelurahan" required forId="kelurahan" error={errors.kelurahan}>
			<Input
				id="kelurahan"
				bind:value={kelurahan}
				disabled={disabled || menyimpan}
				required
			/>
		</Field>
		<Field label="Kode pos" forId="kodepos" error={errors.kode_pos}>
			<Input
				id="kodepos"
				bind:value={kodePos}
				disabled={disabled || menyimpan}
				maxlength={10}
			/>
		</Field>
		<Field label="Alamat pengantaran" forId="antar" error={errors.alamat_pengantaran_barang}>
			<Textarea
				id="antar"
				class="min-h-14"
				bind:value={alamatPengantaran}
				disabled={disabled || menyimpan}
			/>
		</Field>
	</section>

	<section class="grid gap-4 sm:grid-cols-2">
		<h2 class="sm:col-span-2 font-display text-lg text-ink">Pajak & kredit (opsional)</h2>
		<Field label="NPWP / NIK" forId="npwp" error={errors.npwp_nik}>
			<Input
				id="npwp"
				bind:value={npwpNik}
				disabled={disabled || menyimpan}
				maxlength={32}
			/>
		</Field>
		<Field label="Nama pemilik NPWP/NIK" forId="pemilik" error={errors.nama_pemilik_npwp_nik}>
			<Input
				id="pemilik"
				bind:value={namaPemilikNpwpNik}
				disabled={disabled || menyimpan}
			/>
		</Field>
		<Field label="Alamat NPWP/NIK" forId="alamat-npwp" error={errors.alamat_npwp_nik}>
			<Textarea
				id="alamat-npwp"
				class="min-h-14 sm:col-span-2"
				bind:value={alamatNpwpNik}
				disabled={disabled || menyimpan}
			/>
		</Field>
		<Field label="Jenis bangunan" forId="jenis" error={errors.jenis_bangunan}>
			<Select.Root type="single" bind:value={jenisBangunan} disabled={disabled || menyimpan}>
				<Select.Trigger id="jenis" class="w-full">
					{jenisTriggerLabel}
				</Select.Trigger>
				<Select.Content>
					{#each jenisOpts as opsi (opsi.value || '__empty__')}
						<Select.Item value={opsi.value} label={opsi.label}>{opsi.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</Field>
		<Field label="Status bangunan" forId="status-bang" error={errors.status_bangunan}>
			<Select.Root type="single" bind:value={statusBangunan} disabled={disabled || menyimpan}>
				<Select.Trigger id="status-bang" class="w-full">
					{statusTriggerLabel}
				</Select.Trigger>
				<Select.Content>
					{#each statusOpts as opsi (opsi.value || '__empty__')}
						<Select.Item value={opsi.value} label={opsi.label}>{opsi.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
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
		<Button type="submit" disabled={disabled || menyimpan}>
			{menyimpan ? 'Menyimpan…' : mode === 'buat' ? 'Simpan pelanggan' : 'Simpan perubahan'}
		</Button>
	</div>
</form>
