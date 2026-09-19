<script lang="ts">
	import { page } from '$app/state';
	import Field from '$lib/components/form/Field.svelte';
	import AsyncCombobox from '$lib/components/form/AsyncCombobox.svelte';
	import CurrencyInput from '$lib/components/form/CurrencyInput.svelte';
	import { daftarBarang } from '$lib/api/barang';
	import { buatBarangMasuk } from '$lib/api/barang-masuk';
	import { ApiError } from '$lib/api/http';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { pergiKe, resolveAppPath } from '$lib/nav';
	import { onMount } from 'svelte';

	const prefillKode = $derived(page.url.searchParams.get('kode_barang') ?? '');

	let modeBaru = $state(false);
	let kodeBarang = $state('');
	let namaItem = $state('');
	let brand = $state('');
	let satuan = $state('PCS');
	let noFaktur = $state('');
	let noBatch = $state('');
	let exp = $state('');
	let tanggalMasuk = $state(new Date().toISOString().slice(0, 10));
	let qty = $state(1);
	let harga = $state('0.00');
	let disc1 = $state('0.00');
	let disc2 = $state('0.00');
	let disc3 = $state('0.00');
	let markupMtType = $state<'percent' | 'value'>('percent');
	let markupMtAmt = $state('0.00');
	let markupGtType = $state<'percent' | 'value'>('percent');
	let markupGtAmt = $state('0.00');
	let aging = $state(0);
	let errors = $state<Record<string, string>>({});
	let menyimpan = $state(false);

	onMount(() => {
		if (!auth.punyaIzin('barang_masuk.buat')) {
			showToast('Tidak berwenang mencatat penerimaan', 'bahaya');
			void pergiKe('/barang-masuk');
			return;
		}
		if (prefillKode) {
			kodeBarang = prefillKode;
			modeBaru = false;
		}
	});

	async function cariBarang(q: string) {
		const res = await daftarBarang({
			q: q || undefined,
			popular: !q,
			per_page: 12,
			page: 1
		});
		return res.data.map((b) => ({
			value: b.kode_barang,
			label: `${b.kode_barang} — ${b.nama_item}`,
			hint: `${b.brand} · stok ${b.stok_tersedia}`
		}));
	}

	async function simpan() {
		if (menyimpan) return;
		menyimpan = true;
		errors = {};
		try {
			const res = await buatBarangMasuk({
				kode_barang: kodeBarang.trim(),
				buat_barang_baru: modeBaru,
				nama_item: modeBaru ? namaItem.trim() : undefined,
				brand: modeBaru ? brand.trim() : undefined,
				satuan: modeBaru ? satuan.trim() || 'PCS' : undefined,
				no_faktur: noFaktur.trim(),
				no_batch: noBatch.trim(),
				exp,
				tanggal_masuk: tanggalMasuk,
				qty: Number(qty) || 0,
				harga,
				disc_hpp_1: disc1,
				disc_hpp_2: disc2,
				disc_hpp_3: disc3,
				markup_mt_type: markupMtType,
				markup_mt_amount: markupMtAmt,
				markup_gt_type: markupGtType,
				markup_gt_amount: markupGtAmt,
				aging_month: Number(aging) || 0
			});
			showToast(
				`Penerimaan ${res.data.kode_barang} tersimpan · HPP ${res.data.hpp} · MT ${res.data.harga_mt}`,
				'sukses'
			);
			await pergiKe(`/barang-masuk/${res.data.id}`);
		} catch (e) {
			if (e instanceof ApiError) {
				if (e.body.details?.length) {
					const next: Record<string, string> = {};
					for (const d of e.body.details) next[d.field] = d.message;
					errors = next;
				}
				showToast(e.body.message, 'bahaya');
			} else {
				showToast('Gagal menyimpan', 'bahaya');
			}
		} finally {
			menyimpan = false;
		}
	}
</script>

<div class="space-y-4">
	<a href={resolveAppPath('/barang-masuk')} class="text-sm text-brand-700 underline"
		>← Daftar barang masuk</a
	>
	<header>
		<h1 class="font-display text-2xl text-ink">Tambah stok</h1>
		<p class="text-sm text-muted">
			Harga jual (MT/GT) dan HPP dihitung server — tidak diisi manual.
		</p>
	</header>

	<form
		class="grid max-w-2xl gap-4"
		onsubmit={(e) => {
			e.preventDefault();
			void simpan();
		}}
	>
		<label class="flex items-center gap-2 text-sm text-ink">
			<input type="checkbox" bind:checked={modeBaru} />
			Buat master barang baru sekaligus
		</label>

		{#if modeBaru}
			<Field label="Kode barang" required forId="kode" error={errors.kode_barang}>
				<input
					id="kode"
					class="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
					bind:value={kodeBarang}
					required
				/>
			</Field>
			<div class="grid gap-3 sm:grid-cols-2">
				<Field label="Nama item" required forId="nama" error={errors.nama_item}>
					<input
						id="nama"
						class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
						bind:value={namaItem}
						required
					/>
				</Field>
				<Field label="Brand" required forId="brand" error={errors.brand}>
					<input
						id="brand"
						class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
						bind:value={brand}
						required
					/>
				</Field>
			</div>
			<Field label="Satuan" forId="satuan">
				<input
					id="satuan"
					class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
					bind:value={satuan}
				/>
			</Field>
		{:else}
			<Field label="Barang" required forId="cari-barang" error={errors.kode_barang}>
				<AsyncCombobox
					id="cari-barang"
					bind:value={kodeBarang}
					placeholder="Ketik kode/nama — kosong = popular"
					onsearch={cariBarang}
					onchange={(opt) => {
						if (opt) kodeBarang = opt.value;
					}}
				/>
			</Field>
			{#if kodeBarang}
				<p class="font-mono text-xs text-muted">Dipilih: {kodeBarang}</p>
			{/if}
		{/if}

		<div class="grid gap-3 sm:grid-cols-2">
			<Field label="No. faktur" required forId="faktur" error={errors.no_faktur}>
				<input
					id="faktur"
					class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
					bind:value={noFaktur}
					required
				/>
			</Field>
			<Field label="No. batch" required forId="batch" error={errors.no_batch}>
				<input
					id="batch"
					class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
					bind:value={noBatch}
					required
				/>
			</Field>
		</div>

		<div class="grid gap-3 sm:grid-cols-3">
			<Field label="Tanggal masuk" required forId="tgl">
				<input
					id="tgl"
					type="date"
					class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
					bind:value={tanggalMasuk}
					required
				/>
			</Field>
			<Field label="Exp" required forId="exp" error={errors.exp}>
				<input
					id="exp"
					type="date"
					class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
					bind:value={exp}
					required
				/>
			</Field>
			<Field label="Qty" required forId="qty" error={errors.qty}>
				<input
					id="qty"
					type="number"
					min="1"
					class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
					bind:value={qty}
					required
				/>
			</Field>
		</div>

		<Field label="Harga list" required forId="harga" error={errors.harga}>
			<CurrencyInput id="harga" bind:value={harga} />
		</Field>

		<div class="grid gap-3 sm:grid-cols-3">
			<Field label="Disc HPP 1 (%)" forId="d1">
				<input
					id="d1"
					class="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
					bind:value={disc1}
				/>
			</Field>
			<Field label="Disc HPP 2 (%)" forId="d2">
				<input
					id="d2"
					class="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
					bind:value={disc2}
				/>
			</Field>
			<Field label="Disc HPP 3 (%)" forId="d3">
				<input
					id="d3"
					class="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
					bind:value={disc3}
				/>
			</Field>
		</div>

		<div class="grid gap-3 sm:grid-cols-2">
			<div class="grid gap-2">
				<Field label="Markup MT" forId="mt-type">
					<select
						id="mt-type"
						class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
						bind:value={markupMtType}
					>
						<option value="percent">Persen</option>
						<option value="value">Nilai</option>
					</select>
				</Field>
				<CurrencyInput id="mt-amt" bind:value={markupMtAmt} />
			</div>
			<div class="grid gap-2">
				<Field label="Markup GT" forId="gt-type">
					<select
						id="gt-type"
						class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
						bind:value={markupGtType}
					>
						<option value="percent">Persen</option>
						<option value="value">Nilai</option>
					</select>
				</Field>
				<CurrencyInput id="gt-amt" bind:value={markupGtAmt} />
			</div>
		</div>

		<Field label="Aging (bulan)" forId="aging">
			<input
				id="aging"
				type="number"
				min="0"
				class="w-full max-w-[8rem] rounded-lg border border-slate-300 px-3 py-2 text-sm"
				bind:value={aging}
			/>
		</Field>

		<button
			type="submit"
			class="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-50"
			disabled={menyimpan}
		>
			{menyimpan ? 'Menyimpan…' : 'Simpan penerimaan'}
		</button>
	</form>
</div>
