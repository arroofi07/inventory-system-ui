<script lang="ts">
	import Field from '$lib/components/form/Field.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';

	type BarangFormPayload = {
		kode_barang: string;
		nama_item: string;
		brand: string;
		satuan: string;
		min_stock: number;
		reorder_point: number;
		metode_alokasi: 'FEFO';
		expiry_alert_days: number;
	};

	interface Props {
		mode: 'buat' | 'ubah';
		kodeBarang?: string;
		namaItem?: string;
		brand?: string;
		satuan?: string;
		minStock?: number;
		reorderPoint?: number;
		expiryAlertDays?: number;
		disabled?: boolean;
		errors?: Record<string, string>;
		/** Tanpa <form> dan tombol simpan — untuk diletakkan di dalam form lain. */
		hideSubmit?: boolean;
		onsubmit?: (payload: BarangFormPayload) => void | Promise<void>;
	}

	let {
		mode,
		kodeBarang = $bindable(''),
		namaItem = $bindable(''),
		brand = $bindable(''),
		satuan = $bindable('PCS'),
		minStock = $bindable(0),
		reorderPoint = $bindable(0),
		expiryAlertDays = $bindable(30),
		disabled = false,
		errors = {},
		hideSubmit = false,
		onsubmit
	}: Props = $props();

	const uid = $props.id();
	let menyimpan = $state(false);

	const SATUAN_OPSI = [
		{ value: 'PCS', label: 'PCS (buah)' },
		{ value: 'BOX', label: 'BOX (dus)' },
		{ value: 'PACK', label: 'PACK (pack)' },
		{ value: 'CTN', label: 'CTN (karton)' },
		{ value: 'STRIP', label: 'STRIP (strip)' },
		{ value: 'SACHET', label: 'SACHET (sachet)' },
		{ value: 'BOTOL', label: 'BOTOL (botol)' },
		{ value: 'TUBE', label: 'TUBE (tube)' },
		{ value: 'SET', label: 'SET (set)' },
		{ value: 'KG', label: 'KG (kilogram)' },
		{ value: 'LUSIN', label: 'LUSIN (lusin)' }
	] as const;

	const opsiSatuan = $derived.by(() => {
		const current = satuan.trim();
		if (current && !SATUAN_OPSI.some((o) => o.value === current)) {
			return [{ value: current, label: current }, ...SATUAN_OPSI];
		}
		return [...SATUAN_OPSI];
	});

	const satuanTriggerLabel = $derived(
		opsiSatuan.find((o) => o.value === satuan)?.label ?? 'Pilih…'
	);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (menyimpan || disabled || hideSubmit || !onsubmit) return;
		menyimpan = true;
		try {
			await onsubmit({
				kode_barang: kodeBarang.trim(),
				nama_item: namaItem.trim(),
				brand: brand.trim(),
				satuan: satuan.trim() || 'PCS',
				min_stock: Number(minStock) || 0,
				reorder_point: Number(reorderPoint) || 0,
				metode_alokasi: 'FEFO',
				expiry_alert_days: Number(expiryAlertDays) || 30
			});
		} finally {
			menyimpan = false;
		}
	}
</script>

{#snippet fields()}
	<Field label="Kode barang" required forId={`${uid}-kode`} error={errors.kode_barang}>
		<Input
			id={`${uid}-kode`}
			class="font-mono"
			bind:value={kodeBarang}
			disabled={mode === 'ubah' || disabled || menyimpan}
			required
			maxlength={64}
		/>
	</Field>
	<Field label="Nama item" required forId={`${uid}-nama`} error={errors.nama_item}>
		<Input
			id={`${uid}-nama`}
			bind:value={namaItem}
			disabled={disabled || menyimpan}
			required
			maxlength={255}
		/>
	</Field>
	<Field label="Brand" required forId={`${uid}-brand`} error={errors.brand}>
		<Input
			id={`${uid}-brand`}
			bind:value={brand}
			disabled={disabled || menyimpan}
			required
			maxlength={100}
		/>
	</Field>
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		<Field label="Satuan" forId={`${uid}-satuan`}>
			<Select.Root type="single" bind:value={satuan} disabled={disabled || menyimpan}>
				<Select.Trigger id={`${uid}-satuan`} class="w-full">
					{satuanTriggerLabel}
				</Select.Trigger>
				<Select.Content>
					{#each opsiSatuan as opsi (opsi.value)}
						<Select.Item value={opsi.value} label={opsi.label}>{opsi.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</Field>
		<Field
			label="Metode alokasi"
			forId={`${uid}-alokasi`}
			hint="Dikunci FEFO: batch yang kedaluwarsa lebih dulu dikeluarkan lebih dulu."
		>
			<Input id={`${uid}-alokasi`} value="FEFO" readonly tabindex={-1} />
		</Field>
	</div>
{/snippet}

{#if hideSubmit}
	<div class="grid gap-4">
		{@render fields()}
	</div>
{:else}
	<form class="grid max-w-xl gap-4" onsubmit={handleSubmit}>
		{@render fields()}
		<div class="flex gap-2 pt-2">
			<Button type="submit" disabled={disabled || menyimpan}>
				{menyimpan ? 'Menyimpan…' : mode === 'buat' ? 'Simpan barang' : 'Simpan perubahan'}
			</Button>
		</div>
	</form>
{/if}
