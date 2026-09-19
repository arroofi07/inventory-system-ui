<script lang="ts">
	import Field from '$lib/components/form/Field.svelte';

	interface Props {
		mode: 'buat' | 'ubah';
		kodeBarang?: string;
		namaItem?: string;
		brand?: string;
		satuan?: string;
		minStock?: number;
		reorderPoint?: number;
		metodeAlokasi?: string;
		expiryAlertDays?: number;
		disabled?: boolean;
		errors?: Record<string, string>;
		onsubmit: (payload: {
			kode_barang: string;
			nama_item: string;
			brand: string;
			satuan: string;
			min_stock: number;
			reorder_point: number;
			metode_alokasi: 'FEFO' | 'FIFO';
			expiry_alert_days: number;
		}) => void | Promise<void>;
	}

	let {
		mode,
		kodeBarang = $bindable(''),
		namaItem = $bindable(''),
		brand = $bindable(''),
		satuan = $bindable('PCS'),
		minStock = $bindable(0),
		reorderPoint = $bindable(0),
		metodeAlokasi = $bindable('FEFO'),
		expiryAlertDays = $bindable(30),
		disabled = false,
		errors = {},
		onsubmit
	}: Props = $props();

	let menyimpan = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (menyimpan || disabled) return;
		menyimpan = true;
		try {
			await onsubmit({
				kode_barang: kodeBarang.trim(),
				nama_item: namaItem.trim(),
				brand: brand.trim(),
				satuan: satuan.trim() || 'PCS',
				min_stock: Number(minStock) || 0,
				reorder_point: Number(reorderPoint) || 0,
				metode_alokasi: metodeAlokasi === 'FIFO' ? 'FIFO' : 'FEFO',
				expiry_alert_days: Number(expiryAlertDays) || 30
			});
		} finally {
			menyimpan = false;
		}
	}
</script>

<form class="grid max-w-xl gap-4" onsubmit={handleSubmit}>
	<Field label="Kode barang" required forId="kode" error={errors.kode_barang}>
		<input
			id="kode"
			class="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm disabled:bg-slate-50"
			bind:value={kodeBarang}
			disabled={mode === 'ubah' || disabled || menyimpan}
			required
			maxlength={64}
		/>
	</Field>
	<Field label="Nama item" required forId="nama" error={errors.nama_item}>
		<input
			id="nama"
			class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
			bind:value={namaItem}
			disabled={disabled || menyimpan}
			required
			maxlength={255}
		/>
	</Field>
	<Field label="Brand" required forId="brand" error={errors.brand}>
		<input
			id="brand"
			class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
			bind:value={brand}
			disabled={disabled || menyimpan}
			required
			maxlength={100}
		/>
	</Field>
	<div class="grid grid-cols-2 gap-3">
		<Field label="Satuan" forId="satuan">
			<input
				id="satuan"
				class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
				bind:value={satuan}
				disabled={disabled || menyimpan}
			/>
		</Field>
		<Field label="Metode alokasi" forId="alokasi">
			<select
				id="alokasi"
				class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
				bind:value={metodeAlokasi}
				disabled={disabled || menyimpan}
			>
				<option value="FEFO">FEFO</option>
				<option value="FIFO">FIFO</option>
			</select>
		</Field>
	</div>
	<div class="grid grid-cols-3 gap-3">
		<Field label="Min stok" forId="min">
			<input
				id="min"
				type="number"
				min="0"
				class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
				bind:value={minStock}
				disabled={disabled || menyimpan}
			/>
		</Field>
		<Field label="Reorder" forId="reorder">
			<input
				id="reorder"
				type="number"
				min="0"
				class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
				bind:value={reorderPoint}
				disabled={disabled || menyimpan}
			/>
		</Field>
		<Field label="Alert exp (hari)" forId="exp">
			<input
				id="exp"
				type="number"
				min="0"
				class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
				bind:value={expiryAlertDays}
				disabled={disabled || menyimpan}
			/>
		</Field>
	</div>
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
