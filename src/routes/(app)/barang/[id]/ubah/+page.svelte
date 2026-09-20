<script lang="ts">
	import { page } from '$app/state';
	import Field from '$lib/components/form/Field.svelte';
	import NumberInput from '$lib/components/form/NumberInput.svelte';
	import BarangForm from '$lib/components/barang/BarangForm.svelte';
	import HargaPenerimaan from '$lib/components/barang-masuk/HargaPenerimaan.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { daftarBatch, detailBarang, ubahBarang, type BatchListItem } from '$lib/api/barang';
	import { detailBarangMasuk, ubahBarangMasuk } from '$lib/api/barang-masuk';
	import { ApiError } from '$lib/api/http';
	import { hitungAgingMonth, type MarkupTipe } from '$lib/domain/pricing';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { pergiKe, resolveAppPath } from '$lib/nav';

	let loading = $state(true);
	let menyimpan = $state(false);
	let errors = $state<Record<string, string>>({});

	let kodeBarang = $state('');
	let namaItem = $state('');
	let brand = $state('');
	let satuan = $state('PCS');
	let minStock = $state(0);
	let reorderPoint = $state(0);
	let expiryAlertDays = $state(30);

	let batches = $state<BatchListItem[]>([]);
	let batchId = $state<number | null>(null);
	let noFaktur = $state('');
	let noBatch = $state('');
	let exp = $state('');
	let tanggalMasuk = $state('');
	let qty = $state(1);
	let harga = $state('0.00');
	let disc1 = $state('0.00');
	let disc2 = $state('0.00');
	let disc3 = $state('0.00');
	let markupMtType = $state<MarkupTipe>('percent');
	let markupMtAmt = $state('0.00');
	let markupGtType = $state<MarkupTipe>('percent');
	let markupGtAmt = $state('0.00');

	const id = $derived(Number(page.params.id));
	const bisaUbahPenerimaan = $derived(auth.punyaIzin('barang_masuk.ubah'));
	const agingBulan = $derived(hitungAgingMonth(tanggalMasuk, exp));

	const batchSelectOptions = $derived(
		batches.map((b) => ({
			value: String(b.barang_masuk_id),
			label: `${b.no_batch} · faktur ${b.no_faktur} · sisa ${b.qty_tersedia}`
		}))
	);
	const batchSelectValue = $derived(batchId != null ? String(batchId) : '');
	const batchSelectLabel = $derived(
		batchSelectOptions.find((o) => o.value === batchSelectValue)?.label ?? 'Pilih…'
	);

	function isiDariBatch(b: BatchListItem) {
		batchId = b.barang_masuk_id;
		noFaktur = b.no_faktur;
		noBatch = b.no_batch;
		exp = b.exp;
		tanggalMasuk = b.tanggal_masuk;
		qty = b.qty_masuk;
		harga = b.harga;
		// disc/markup lengkap dari detail penerimaan
	}

	async function muatDetailBatch(bmId: number) {
		const res = await detailBarangMasuk(bmId);
		const d = res.data;
		noFaktur = d.no_faktur;
		noBatch = d.no_batch;
		exp = d.exp;
		tanggalMasuk = d.tanggal_masuk;
		qty = d.qty;
		harga = d.harga;
		disc1 = d.disc_hpp_1;
		disc2 = d.disc_hpp_2;
		disc3 = d.disc_hpp_3;
		markupMtType = (d.markup_mt_type as MarkupTipe) || 'percent';
		markupMtAmt = d.markup_mt_amount;
		markupGtType = (d.markup_gt_type as MarkupTipe) || 'percent';
		markupGtAmt = d.markup_gt_amount;
	}

	async function pilihBatch(idStr: string) {
		const bmId = Number(idStr);
		const b = batches.find((x) => x.barang_masuk_id === bmId);
		if (!b) return;
		isiDariBatch(b);
		try {
			await muatDetailBatch(bmId);
		} catch {
			showToast('Gagal memuat detail batch', 'bahaya');
		}
	}

	$effect(() => {
		if (!auth.punyaIzin('barang.kelola')) {
			showToast('Tidak berwenang mengubah barang', 'bahaya');
			void pergiKe('/barang');
			return;
		}
		const currentId = id;
		if (!Number.isFinite(currentId) || currentId <= 0) return;
		loading = true;
		void detailBarang(currentId)
			.then(async (res) => {
				const b = res.data;
				kodeBarang = b.kode_barang;
				namaItem = b.nama_item;
				brand = b.brand;
				satuan = b.satuan;
				minStock = b.min_stock;
				reorderPoint = b.reorder_point;
				expiryAlertDays = b.expiry_alert_days;

				const batchRes = await daftarBatch(b.kode_barang);
				batches = batchRes.data ?? [];
				const first = batches[0];
				if (first && bisaUbahPenerimaan) {
					isiDariBatch(first);
					await muatDetailBatch(first.barang_masuk_id);
				} else {
					batchId = null;
				}
			})
			.catch((e) => {
				showToast(e instanceof ApiError ? e.body.message : 'Gagal memuat', 'bahaya');
				void pergiKe('/barang');
			})
			.finally(() => {
				loading = false;
			});
	});

	async function simpan() {
		if (menyimpan) return;
		menyimpan = true;
		errors = {};
		try {
			await ubahBarang(id, {
				nama_item: namaItem.trim(),
				brand: brand.trim(),
				satuan: satuan.trim() || 'PCS',
				min_stock: Number(minStock) || 0,
				reorder_point: Number(reorderPoint) || 0,
				metode_alokasi: 'FEFO',
				expiry_alert_days: Number(expiryAlertDays) || 30
			});

			if (bisaUbahPenerimaan && batchId) {
				await ubahBarangMasuk(batchId, {
					no_faktur: noFaktur.trim(),
					no_batch: noBatch.trim(),
					exp: exp.trim(),
					tanggal_masuk: tanggalMasuk.trim(),
					qty: Number(qty) || 1,
					harga,
					disc_hpp_1: disc1,
					disc_hpp_2: disc2,
					disc_hpp_3: disc3,
					markup_mt_type: markupMtType,
					markup_mt_amount: markupMtAmt,
					markup_gt_type: markupGtType,
					markup_gt_amount: markupGtAmt,
					aging_month: agingBulan
				});
			}

			showToast('Perubahan disimpan', 'sukses');
			await pergiKe(`/barang/${id}`);
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
		} finally {
			menyimpan = false;
		}
	}
</script>

<div class="space-y-4">
	<Button variant="link" class="h-auto p-0" href={resolveAppPath(`/barang/${id}`)}>
		← Kembali ke detail
	</Button>
	<header>
		<h1 class="font-display text-2xl text-ink">Ubah barang</h1>
		<p class="text-sm text-muted">
			Form sama seperti input master: data SKU
			{#if bisaUbahPenerimaan && batches.length}
				+ penerimaan/harga batch
			{/if}. Kode tidak dapat diubah.
		</p>
	</header>

	{#if loading}
		<p class="text-sm text-muted">Memuat…</p>
	{:else}
		<form
			class="grid max-w-3xl gap-4"
			onsubmit={(e) => {
				e.preventDefault();
				void simpan();
			}}
		>
			<BarangForm
				hideSubmit
				mode="ubah"
				bind:kodeBarang
				bind:namaItem
				bind:brand
				bind:satuan
				bind:minStock
				bind:reorderPoint
				bind:expiryAlertDays
				{errors}
				disabled={menyimpan}
			/>

			{#if bisaUbahPenerimaan && batches.length}
				<section class="space-y-4 border-t border-primary/20 pt-4">
					<h2 class="font-display text-lg text-ink">Penerimaan & harga</h2>

					{#if batches.length > 1}
						<Field label="Batch yang diubah" forId="pilih-batch">
							<Select.Root
								type="single"
								value={batchSelectValue}
								onValueChange={(v) => void pilihBatch(v)}
								disabled={menyimpan}
							>
								<Select.Trigger id="pilih-batch" class="w-full">
									{batchSelectLabel}
								</Select.Trigger>
								<Select.Content>
									{#each batchSelectOptions as opsi (opsi.value)}
										<Select.Item value={opsi.value} label={opsi.label}>{opsi.label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</Field>
					{/if}

					<div class="grid gap-3 sm:grid-cols-2">
						<Field label="No. faktur" required forId="faktur" error={errors.no_faktur}>
							<Input id="faktur" bind:value={noFaktur} required disabled={menyimpan} />
						</Field>
						<Field label="No. batch" required forId="batch" error={errors.no_batch}>
							<Input id="batch" bind:value={noBatch} required disabled={menyimpan} />
						</Field>
					</div>

					<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
						<Field label="Tanggal masuk" required forId="tgl">
							<Input id="tgl" type="date" bind:value={tanggalMasuk} required disabled={menyimpan} />
						</Field>
						<Field label="Exp" required forId="exp" error={errors.exp}>
							<Input id="exp" type="date" bind:value={exp} required disabled={menyimpan} />
						</Field>
						<Field label="Qty" required forId="qty" error={errors.qty}>
							<NumberInput id="qty" min={1} bind:value={qty} required disabled={menyimpan} />
						</Field>
						<Field label="Aging (bulan)" forId="aging" hint="Otomatis dari tanggal masuk ke exp">
							<Input
								id="aging"
								type="text"
								readonly
								class="bg-primary/5 tabular-nums"
								value={exp ? String(agingBulan) : '—'}
								tabindex={-1}
							/>
						</Field>
					</div>

					<HargaPenerimaan
						bind:harga
						bind:disc1
						bind:disc2
						bind:disc3
						bind:markupMtType
						bind:markupMtAmt
						bind:markupGtType
						bind:markupGtAmt
						{errors}
						disabled={menyimpan}
					/>
				</section>
			{:else if !batches.length}
				<p class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
					Belum ada penerimaan. Ubah hanya data master.
					<Button
						variant="link"
						class="h-auto p-0"
						href={resolveAppPath(`/barang-masuk/baru?kode_barang=${encodeURIComponent(kodeBarang)}`)}
					>
						Tambah stok
					</Button>
					untuk isi batch & harga.
				</p>
			{/if}

			<Button type="submit" disabled={menyimpan}>
				{menyimpan ? 'Menyimpan…' : 'Simpan perubahan'}
			</Button>
		</form>
	{/if}
</div>
