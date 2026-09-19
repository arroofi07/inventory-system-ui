<script lang="ts">
	import Field from '$lib/components/form/Field.svelte';

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
		<input
			id={`${uid}-kode`}
			class="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm disabled:bg-slate-50"
			bind:value={kodeBarang}
			disabled={mode === 'ubah' || disabled || menyimpan}
			required
			maxlength={64}
		/>
	</Field>
	<Field label="Nama item" required forId={`${uid}-nama`} error={errors.nama_item}>
		<input
			id={`${uid}-nama`}
			class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
			bind:value={namaItem}
			disabled={disabled || menyimpan}
			required
			maxlength={255}
		/>
	</Field>
	<Field label="Brand" required forId={`${uid}-brand`} error={errors.brand}>
		<input
			id={`${uid}-brand`}
			class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
			bind:value={brand}
			disabled={disabled || menyimpan}
			required
			maxlength={100}
		/>
	</Field>
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		<Field label="Satuan" forId={`${uid}-satuan`}>
			<select
				id={`${uid}-satuan`}
				class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
				bind:value={satuan}
				disabled={disabled || menyimpan}
			>
				{#each opsiSatuan as opsi (opsi.value)}
					<option value={opsi.value}>{opsi.label}</option>
				{/each}
			</select>
		</Field>
		<Field
			label="Metode alokasi"
			forId={`${uid}-alokasi`}
			hint="Dikunci FEFO: batch yang kedaluwarsa lebih dulu dikeluarkan lebih dulu."
		>
			<input
				id={`${uid}-alokasi`}
				class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
				value="FEFO"
				readonly
				tabindex="-1"
			/>
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
			<button
				type="submit"
				class="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-50"
				disabled={disabled || menyimpan}
			>
				{menyimpan ? 'Menyimpan…' : mode === 'buat' ? 'Simpan barang' : 'Simpan perubahan'}
			</button>
		</div>
	</form>
{/if}
