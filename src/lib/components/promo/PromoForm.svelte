<script lang="ts">
	import Field from '$lib/components/form/Field.svelte';
	import NumberInput from '$lib/components/form/NumberInput.svelte';
	import Combobox from '$lib/components/form/Combobox.svelte';
	import CurrencyInput from '$lib/components/form/CurrencyInput.svelte';
	import PercentInput from '$lib/components/form/PercentInput.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import {
		TIPE_PROMO_OPTIONS,
		type PromoCreateBody,
		type TipePromo
	} from '$lib/api/promo';

	interface Props {
		mode: 'buat' | 'ubah';
		kodePromo?: string;
		namaPromo?: string;
		deskripsi?: string;
		tipePromo?: string;
		buyQty?: number;
		getQty?: number;
		bonusQty?: number;
		discountPercentage?: string;
		discountAmount?: string;
		minQty?: number;
		minAmount?: string;
		maxApplications?: string;
		kodeBarang?: string;
		tanggalMulai?: string;
		tanggalBerakhir?: string;
		syaratKetentuan?: string;
		disabled?: boolean;
		errors?: Record<string, string>;
		onsubmit: (payload: PromoCreateBody) => void | Promise<void>;
	}

	let {
		mode,
		kodePromo = $bindable(''),
		namaPromo = $bindable(''),
		deskripsi = $bindable(''),
		tipePromo = $bindable('percentage_discount'),
		buyQty = $bindable(1),
		getQty = $bindable(1),
		bonusQty = $bindable(1),
		discountPercentage = $bindable('10'),
		discountAmount = $bindable('1000'),
		minQty = $bindable(1),
		minAmount = $bindable('0'),
		maxApplications = $bindable(''),
		kodeBarang = $bindable(''),
		tanggalMulai = $bindable(''),
		tanggalBerakhir = $bindable(''),
		syaratKetentuan = $bindable(''),
		disabled = false,
		errors = {},
		onsubmit
	}: Props = $props();

	let menyimpan = $state(false);

	const tipeOpts = TIPE_PROMO_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
	const tipe = $derived(tipePromo as TipePromo);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (menyimpan || disabled) return;
		menyimpan = true;
		try {
			const payload: PromoCreateBody = {
				nama_promo: namaPromo.trim(),
				deskripsi: deskripsi.trim() || null,
				tipe_promo: tipe,
				min_qty: Number(minQty) || 1,
				min_amount: minAmount || '0',
				kode_barang: kodeBarang.trim() || null,
				tanggal_mulai: tanggalMulai.trim(),
				tanggal_berakhir: tanggalBerakhir.trim(),
				syarat_ketentuan: syaratKetentuan.trim() || null
			};
			if (mode === 'buat' && kodePromo.trim()) {
				payload.kode_promo = kodePromo.trim();
			}
			const maxApp = maxApplications.trim();
			if (maxApp) {
				payload.max_applications = Number(maxApp);
			}
			switch (tipe) {
				case 'buy_x_get_y':
					payload.buy_qty = Number(buyQty) || 0;
					payload.get_qty = Number(getQty) || 0;
					break;
				case 'bonus_qty':
					payload.bonus_qty = Number(bonusQty) || 0;
					break;
				case 'percentage_discount':
					payload.discount_percentage = discountPercentage;
					break;
				case 'fixed_discount':
					payload.discount_amount = discountAmount;
					break;
				default: {
					const _exhaustive: never = tipe;
					void _exhaustive;
				}
			}
			await onsubmit(payload);
		} finally {
			menyimpan = false;
		}
	}
</script>

<form class="grid max-w-xl gap-4" onsubmit={handleSubmit}>
	{#if mode === 'buat'}
		<Field label="Kode promo (opsional)" forId="kode" error={errors.kode_promo} hint="Kosongkan untuk generate PROMO+YYYYMM+####">
			<Input
				id="kode"
				class="font-mono"
				bind:value={kodePromo}
				disabled={disabled || menyimpan}
				maxlength={64}
			/>
		</Field>
	{/if}
	<Field label="Nama promo" required forId="nama" error={errors.nama_promo}>
		<Input
			id="nama"
			bind:value={namaPromo}
			disabled={disabled || menyimpan}
			required
			maxlength={255}
		/>
	</Field>
	<Field label="Tipe" required forId="tipe" error={errors.tipe_promo}>
		<Combobox id="tipe" options={tipeOpts} bind:value={tipePromo} disabled={disabled || menyimpan} />
	</Field>

	{#if tipe === 'buy_x_get_y'}
		<div class="grid grid-cols-2 gap-3">
			<Field label="Beli (X)" required forId="buy" error={errors.buy_qty}>
				<NumberInput
					id="buy"
					min={1}
					bind:value={buyQty}
					disabled={disabled || menyimpan}
					required
				/>
			</Field>
			<Field label="Gratis (Y)" required forId="get" error={errors.get_qty}>
				<NumberInput
					id="get"
					min={1}
					bind:value={getQty}
					disabled={disabled || menyimpan}
					required
				/>
			</Field>
		</div>
	{:else if tipe === 'bonus_qty'}
		<Field label="Bonus qty" required forId="bonus" error={errors.bonus_qty}>
			<NumberInput
				id="bonus"
				min={1}
				bind:value={bonusQty}
				disabled={disabled || menyimpan}
				required
			/>
		</Field>
	{:else if tipe === 'percentage_discount'}
		<Field label="Diskon %" required forId="pct" error={errors.discount_percentage} hint="0,01–100 (divalidasi server)">
			<PercentInput
				id="pct"
				class="w-full"
				bind:value={discountPercentage}
				min={0.01}
				disabled={disabled || menyimpan}
			/>
		</Field>
	{:else if tipe === 'fixed_discount'}
		<Field label="Diskon nominal" required forId="amt" error={errors.discount_amount}>
			<CurrencyInput id="amt" bind:value={discountAmount} disabled={disabled || menyimpan} />
		</Field>
	{/if}

	<div class="grid grid-cols-2 gap-3">
		<Field label="Tanggal mulai" required forId="mulai" error={errors.tanggal_mulai}>
			<Input
				id="mulai"
				type="date"
				bind:value={tanggalMulai}
				disabled={disabled || menyimpan}
				required
			/>
		</Field>
		<Field label="Tanggal berakhir" required forId="akhir" error={errors.tanggal_berakhir}>
			<Input
				id="akhir"
				type="date"
				bind:value={tanggalBerakhir}
				disabled={disabled || menyimpan}
				required
			/>
		</Field>
	</div>

	<div class="grid grid-cols-2 gap-3">
		<Field label="Min qty" forId="minqty" error={errors.min_qty}>
			<NumberInput id="minqty" min={1} bind:value={minQty} disabled={disabled || menyimpan} />
		</Field>
		<Field label="Min amount" forId="minamt" error={errors.min_amount}>
			<CurrencyInput id="minamt" bind:value={minAmount} disabled={disabled || menyimpan} />
		</Field>
	</div>

	<Field label="Max applications" forId="maxapp" error={errors.max_applications}>
		<Input
			id="maxapp"
			type="number"
			min="1"
			inputmode="decimal"
			bind:value={maxApplications}
			disabled={disabled || menyimpan}
			placeholder="Opsional"
			onfocus={() => {
				if (maxApplications === '0') maxApplications = '';
			}}
		/>
	</Field>
	<Field label="Kode barang (opsional)" forId="sku" error={errors.kode_barang}>
		<Input
			id="sku"
			class="font-mono"
			bind:value={kodeBarang}
			disabled={disabled || menyimpan}
			placeholder="Kosong = semua SKU"
		/>
	</Field>
	<Field label="Deskripsi" forId="desc" error={errors.deskripsi}>
		<Textarea
			id="desc"
			class="min-h-14"
			bind:value={deskripsi}
			disabled={disabled || menyimpan}
		/>
	</Field>
	<Field label="Syarat & ketentuan" forId="syarat" error={errors.syarat_ketentuan}>
		<Textarea
			id="syarat"
			class="min-h-14"
			bind:value={syaratKetentuan}
			disabled={disabled || menyimpan}
		/>
	</Field>

	<Button type="submit" disabled={disabled || menyimpan}>
		{menyimpan ? 'Menyimpan…' : mode === 'buat' ? 'Simpan promo' : 'Simpan perubahan'}
	</Button>
</form>
