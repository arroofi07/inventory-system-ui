<script lang="ts">
	import { page } from '$app/state';
	import Field from '$lib/components/form/Field.svelte';
	import NumberInput from '$lib/components/form/NumberInput.svelte';
	import HargaPenerimaan from '$lib/components/barang-masuk/HargaPenerimaan.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		detailBarangMasuk,
		ubahBarangMasuk,
		type BarangMasuk
	} from '$lib/api/barang-masuk';
	import { ApiError } from '$lib/api/http';
	import { hitungAgingMonth, type MarkupTipe } from '$lib/domain/pricing';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { pergiKe, resolveAppPath } from '$lib/nav';

	let loading = $state(true);
	let menyimpan = $state(false);
	let errors = $state<Record<string, string>>({});
	let item = $state<BarangMasuk | null>(null);

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
	const agingBulan = $derived(hitungAgingMonth(tanggalMasuk, exp));

	$effect(() => {
		if (!auth.punyaIzin('barang_masuk.ubah')) {
			showToast('Tidak berwenang mengubah penerimaan', 'bahaya');
			void pergiKe('/barang-masuk');
			return;
		}
		const currentId = id;
		if (!Number.isFinite(currentId) || currentId <= 0) return;
		loading = true;
		void detailBarangMasuk(currentId)
			.then((res) => {
				const d = res.data;
				item = d;
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
			})
			.catch((e) => {
				showToast(e instanceof ApiError ? e.body.message : 'Gagal memuat', 'bahaya');
				void pergiKe('/barang-masuk');
			})
			.finally(() => {
				loading = false;
			});
	});

	async function simpan() {
		if (menyimpan || !item) return;
		menyimpan = true;
		errors = {};
		try {
			await ubahBarangMasuk(item.id, {
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
			showToast('Penerimaan diperbarui', 'sukses');
			await pergiKe(`/barang-masuk/${item.id}`);
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
	<Button variant="link" class="h-auto p-0" href={resolveAppPath(`/barang-masuk/${id}`)}>
		← Kembali ke detail
	</Button>
	<header>
		<h1 class="font-display text-2xl text-ink">Ubah penerimaan</h1>
		{#if item}
			<p class="font-mono text-sm text-muted">{item.kode_barang} — {item.nama_item}</p>
		{/if}
		<p class="text-sm text-muted">Harga jual (MT/GT) dan HPP dihitung ulang server saat simpan.</p>
	</header>

	{#if loading}
		<p class="text-sm text-muted">Memuat…</p>
	{:else if item}
		<form
			class="grid max-w-3xl gap-4"
			onsubmit={(e) => {
				e.preventDefault();
				void simpan();
			}}
		>
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

			<Button type="submit" disabled={menyimpan}>
				{menyimpan ? 'Menyimpan…' : 'Simpan perubahan'}
			</Button>
		</form>
	{/if}
</div>
