<script lang="ts">
	import { page } from '$app/state';
	import Field from '$lib/components/form/Field.svelte';
	import CurrencyInput from '$lib/components/form/CurrencyInput.svelte';
	import PercentInput from '$lib/components/form/PercentInput.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { daftarBatch, detailBarang, type BatchListItem, type Barang } from '$lib/api/barang';
	import { hargaMassal } from '$lib/api/harga';
	import { ApiError } from '$lib/api/http';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { pergiKe, resolveAppPath } from '$lib/nav';
	import { formatRupiah, parseRupiah } from '$lib/domain/format';
	import { hitungHargaChannel, hitungHPP, type MarkupTipe } from '$lib/domain/pricing';
	import { onMount, untrack } from 'svelte';

	const MARKUP_TIPE_OPTIONS: { value: MarkupTipe; label: string }[] = [
		{ value: 'percent', label: 'Persen dari harga list' },
		{ value: 'value', label: 'Nominal rupiah' }
	];

	const id = $derived(Number(page.params.id));

	let barang = $state<Barang | null>(null);
	let batches = $state<BatchListItem[]>([]);
	let selected = $state<Record<number, boolean>>({});
	let ubahHarga = $state(false);
	let harga = $state('0.00');
	let markupMtAmt = $state('0.00');
	let markupGtAmt = $state('0.00');
	let markupMtType = $state<MarkupTipe>('percent');
	let markupGtType = $state<MarkupTipe>('percent');
	let keterangan = $state('');
	let loading = $state(true);
	let menyimpan = $state(false);
	/** Batch terakhir yang dicentang; input MT/GT mengikuti batch ini. */
	let batchAcuanId = $state<number | null>(null);
	let urutanCentang = $state<number[]>([]);

	onMount(() => {
		if (!auth.punyaIzin('harga.kelola')) {
			showToast('Hanya super_admin yang boleh ubah harga massal', 'bahaya');
			void pergiKe(`/barang/${id}`);
		}
	});

	$effect(() => {
		const barangId = id;
		untrack(() => {
			void muat(barangId);
		});
	});

	function tipeMarkup(raw: string | undefined): MarkupTipe {
		return raw === 'value' ? 'value' : 'percent';
	}

	function angka(raw: string | undefined, fallback = '0.00'): string {
		if (raw == null || String(raw).trim() === '') return fallback;
		return String(raw);
	}

	async function muat(barangId: number) {
		if (!Number.isFinite(barangId) || barangId <= 0) {
			loading = false;
			return;
		}
		loading = true;
		try {
			const d = await detailBarang(barangId);
			if (barangId !== id) return;
			const res = await daftarBatch(d.data.kode_barang);
			if (barangId !== id) return;
			barang = d.data;
			batches = res.data ?? [];
			selected = {};
			urutanCentang = [];
			if (batches.length === 1) {
				selected = { [batches[0].barang_masuk_id]: true };
				urutanCentang = [batches[0].barang_masuk_id];
				isiDari(batches[0]);
			} else {
				isiDari(null);
			}
		} catch (e) {
			if (barangId !== id) return;
			batches = [];
			showToast(e instanceof ApiError ? e.body.message : 'Gagal memuat', 'bahaya');
		} finally {
			if (barangId === id) loading = false;
		}
	}

	function isiDari(b: BatchListItem | null) {
		batchAcuanId = b?.barang_masuk_id ?? null;
		if (!b) {
			harga = '0.00';
			markupMtType = 'percent';
			markupGtType = 'percent';
			markupMtAmt = '';
			markupGtAmt = '';
			return;
		}
		harga = angka(b.harga);
		const mt = markupDariBatch(b, 'mt');
		const gt = markupDariBatch(b, 'gt');
		markupMtType = mt.type;
		markupGtType = gt.type;
		markupMtAmt = mt.amount;
		markupGtAmt = gt.amount;
	}

	function toggle(batchId: number) {
		const nyala = !selected[batchId];
		selected = { ...selected, [batchId]: nyala };
		urutanCentang = nyala
			? [...urutanCentang.filter((idBatch) => idBatch !== batchId), batchId]
			: urutanCentang.filter((idBatch) => idBatch !== batchId);
		const sumberId = [...urutanCentang].reverse().find((idBatch) => selected[idBatch]);
		isiDari(batches.find((b) => b.barang_masuk_id === sumberId) ?? null);
	}

	const idsDipilih = $derived(
		batches.filter((b) => selected[b.barang_masuk_id]).map((b) => b.barang_masuk_id)
	);
	const batchTerpilih = $derived(batches.filter((b) => selected[b.barang_masuk_id]));
	const semuaDipilih = $derived(batches.length > 0 && idsDipilih.length === batches.length);
	const batchAcuan = $derived(batches.find((b) => b.barang_masuk_id === batchAcuanId) ?? null);

	function rumusMarkup(list: string, amount: string, tipe: MarkupTipe): string {
		if (tipe === 'value') return `${formatRupiah(list)} + ${formatRupiah(amount)}`;
		return `${formatRupiah(list)} + ${angka(amount, '0')}%`;
	}

	function setSemua(nyala: boolean) {
		const next: Record<number, boolean> = {};
		for (const b of batches) next[b.barang_masuk_id] = nyala;
		selected = next;
		if (!nyala) {
			urutanCentang = [];
			isiDari(null);
			return;
		}
		urutanCentang = batches.map((b) => b.barang_masuk_id);
		if (batches.length === 1) isiDari(batches[0]);
	}

	function hargaPakai(b: BatchListItem): string {
		return ubahHarga ? harga : angka(b.harga);
	}

	function pratinjau(b: BatchListItem) {
		const list = hargaPakai(b);
		return {
			list,
			hpp: hitungHPP(list, angka(b.disc_hpp_1, '0'), angka(b.disc_hpp_2, '0'), angka(b.disc_hpp_3, '0')),
			mt: hitungHargaChannel(list, markupMtAmt || '0', markupMtType),
			gt: hitungHargaChannel(list, markupGtAmt || '0', markupGtType)
		};
	}

	function adaNilai(raw: string | undefined): boolean {
		return raw != null && String(raw).trim() !== '';
	}

	function keAngka(raw: string | undefined): number {
		const n = Number.parseFloat(parseRupiah(String(raw ?? '0')));
		return Number.isFinite(n) ? n : 0;
	}

	/** Pakai markup tersimpan. Bila API belum mengirimnya, turunkan dari harga jual vs harga list. */
	function markupDariBatch(b: BatchListItem, channel: 'mt' | 'gt'): { type: MarkupTipe; amount: string } {
		const tersimpan = channel === 'mt' ? b.markup_mt_amount : b.markup_gt_amount;
		const tipe = channel === 'mt' ? b.markup_mt_type : b.markup_gt_type;
		if (adaNilai(tersimpan)) {
			return { type: tipeMarkup(tipe), amount: String(tersimpan) };
		}
		const list = keAngka(b.harga);
		const jual = keAngka(channel === 'mt' ? b.harga_mt : b.harga_gt);
		if (!list) return { type: 'percent', amount: '0' };
		const persen = ((jual - list) / list) * 100;
		const amount = persen.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
		return { type: 'percent', amount };
	}

	function persenMarkup(list: string, amount: string, tipe: MarkupTipe): string {
		if (tipe === 'percent') return angka(amount, '0');
		const dasar = keAngka(list);
		if (!dasar) return '0';
		const persen = (keAngka(amount) / dasar) * 100;
		return persen.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
	}

	function rupiahMarkup(list: string, amount: string, tipe: MarkupTipe): string {
		const dasar = keAngka(list);
		const nom = tipe === 'value' ? keAngka(amount) : (dasar * keAngka(amount)) / 100;
		return nom.toFixed(2);
	}

	function beda(a: string, b: string): boolean {
		return formatRupiah(a, { tanpaSimbol: true }) !== formatRupiah(b, { tanpaSimbol: true });
	}

	async function simpan() {
		if (menyimpan || idsDipilih.length === 0) return;
		menyimpan = true;
		try {
			const body: Parameters<typeof hargaMassal>[1] = {
				batch_ids: idsDipilih,
				markup_mt_type: markupMtType,
				markup_mt_amount: markupMtAmt,
				markup_gt_type: markupGtType,
				markup_gt_amount: markupGtAmt,
				keterangan: keterangan.trim() || undefined
			};
			if (ubahHarga) body.harga = harga;
			const res = await hargaMassal(id, body);
			showToast(
				`${res.data.jumlah_batch_diperbarui} batch diperbarui, ${res.data.jumlah_dilewati} dilewati`,
				'sukses'
			);
			await pergiKe(`/barang/${id}/riwayat-harga`);
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal menyimpan', 'bahaya');
		} finally {
			menyimpan = false;
		}
	}

	function onUbahHargaChange(v: boolean | 'indeterminate') {
		ubahHarga = v === true;
	}

	function setMarkupMtType(v: string) {
		markupMtType = v === 'value' ? 'value' : 'percent';
	}

	function setMarkupGtType(v: string) {
		markupGtType = v === 'value' ? 'value' : 'percent';
	}

	const markupMtTriggerLabel = $derived(
		MARKUP_TIPE_OPTIONS.find((o) => o.value === markupMtType)?.label ?? 'Pilih…'
	);
	const markupGtTriggerLabel = $derived(
		MARKUP_TIPE_OPTIONS.find((o) => o.value === markupGtType)?.label ?? 'Pilih…'
	);
</script>

<div class="space-y-4">
	<Button variant="link" class="h-auto p-0" href={resolveAppPath(`/barang/${id}`)}>
		← Kembali ke detail
	</Button>
	<header class="space-y-1">
		<h1 class="font-display text-2xl text-ink">Harga massal</h1>
		<p class="text-sm text-muted">
			{#if barang}{barang.kode_barang} — {barang.nama_item}{:else}…{/if}
		</p>
		<p class="max-w-2xl text-sm text-muted-foreground">
			Harga jual dihitung dari <strong>harga list</strong>, bukan dari HPP.
			MT = list + markup MT, GT = list + markup GT. Diskon tiap batch tetap, dan hanya mengubah HPP.
		</p>
	</header>

	{#if loading}
		<p class="text-sm text-muted">Memuat batch…</p>
	{:else if batches.length === 0}
		<p class="text-sm text-muted">Belum ada batch untuk SKU ini.</p>
	{:else}
		<form
			class="grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start"
			onsubmit={(e) => {
				e.preventDefault();
				void simpan();
			}}
		>
			<Card.Root class="gap-0 space-y-4 border p-4 shadow-none ring-0">
				<h2 class="text-sm font-semibold text-foreground">Nilai yang diterapkan</h2>

				<label class="flex items-start gap-2 text-sm text-foreground">
					<Checkbox class="mt-1" checked={ubahHarga} onCheckedChange={onUbahHargaChange} />
					<span>Ganti harga list semua batch terpilih. Jika tidak dicentang, harga list tiap batch tetap.</span>
				</label>
				{#if ubahHarga}
					<Field label="Harga list baru" forId="harga">
						<CurrencyInput id="harga" bind:value={harga} />
					</Field>
				{/if}

				<div class="grid gap-3">
					<p class="text-xs text-primary/70">
						{#if batchAcuan}
							Markup diisi dari batch <span class="font-mono">{batchAcuan.no_batch}</span>. Centang batch lain untuk mengganti, matikan centang untuk mengosongkan.
						{:else}
							Centang satu batch agar markup MT dan GT terisi dari batch itu.
						{/if}
					</p>
					<Field label="Markup Modern Trade" forId="mt-type">
						<Select.Root
							type="single"
							value={markupMtType}
							onValueChange={setMarkupMtType}
							disabled={!batchAcuan}
						>
							<Select.Trigger id="mt-type" class="w-full">
								{markupMtTriggerLabel}
							</Select.Trigger>
							<Select.Content>
								{#each MARKUP_TIPE_OPTIONS as opsi (opsi.value)}
									<Select.Item value={opsi.value} label={opsi.label}>{opsi.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</Field>
					{#key `${batchAcuanId ?? 'kosong'}-${markupMtType}`}
						{#if markupMtType === 'percent'}
							<PercentInput
								id="mt-amt"
								class="w-full"
								max={1000}
								bind:value={markupMtAmt}
								disabled={!batchAcuan}
							/>
						{:else}
							<CurrencyInput id="mt-amt" bind:value={markupMtAmt} disabled={!batchAcuan} />
						{/if}
					{/key}
					{@render rincianMarkup('MT', markupMtAmt, markupMtType)}

					<Field label="Markup General Trade" forId="gt-type">
						<Select.Root
							type="single"
							value={markupGtType}
							onValueChange={setMarkupGtType}
							disabled={!batchAcuan}
						>
							<Select.Trigger id="gt-type" class="w-full">
								{markupGtTriggerLabel}
							</Select.Trigger>
							<Select.Content>
								{#each MARKUP_TIPE_OPTIONS as opsi (opsi.value)}
									<Select.Item value={opsi.value} label={opsi.label}>{opsi.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</Field>
					{#key `${batchAcuanId ?? 'kosong'}-${markupGtType}`}
						{#if markupGtType === 'percent'}
							<PercentInput
								id="gt-amt"
								class="w-full"
								max={1000}
								bind:value={markupGtAmt}
								disabled={!batchAcuan}
							/>
						{:else}
							<CurrencyInput id="gt-amt" bind:value={markupGtAmt} disabled={!batchAcuan} />
						{/if}
					{/key}
					{@render rincianMarkup('GT', markupGtAmt, markupGtType)}
				</div>

				<div class="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
					<p class="text-xs font-semibold uppercase tracking-wide text-primary/70">
						Harga jual batch terpilih
					</p>
					{#if batchTerpilih.length === 0}
						<p class="text-sm text-muted">Belum ada batch yang dicentang.</p>
					{:else}
						<ul class="space-y-3">
							{#each batchTerpilih as b (b.barang_masuk_id)}
								{@const next = pratinjau(b)}
								<li class="space-y-1.5 border-t border-primary/20 pt-2 first:border-0 first:pt-0">
									<p class="font-mono text-xs text-foreground">{b.no_batch}</p>
									<p class="text-xs text-primary/70">Harga list {formatRupiah(next.list)}</p>
									<div class="grid grid-cols-2 gap-2">
										<div class="rounded-md bg-violet-50 px-2 py-1.5">
											<p class="text-[10px] font-bold uppercase text-violet-800">MT</p>
											<p class="text-sm font-semibold tabular-nums text-violet-950">
												{formatRupiah(next.mt)}
											</p>
											<p class="text-[11px] leading-snug text-violet-800/80">
												{rumusMarkup(next.list, markupMtAmt, markupMtType)}
											</p>
											{#if beda(b.harga_mt, next.mt)}
												<p class="text-[11px] text-violet-700">sekarang {formatRupiah(b.harga_mt)}</p>
											{/if}
										</div>
										<div class="rounded-md bg-amber-50 px-2 py-1.5">
											<p class="text-[10px] font-bold uppercase text-amber-800">GT</p>
											<p class="text-sm font-semibold tabular-nums text-amber-950">
												{formatRupiah(next.gt)}
											</p>
											<p class="text-[11px] leading-snug text-amber-800/80">
												{rumusMarkup(next.list, markupGtAmt, markupGtType)}
											</p>
											{#if beda(b.harga_gt, next.gt)}
												<p class="text-[11px] text-amber-800">sekarang {formatRupiah(b.harga_gt)}</p>
											{/if}
										</div>
									</div>
								</li>
							{/each}
						</ul>
					{/if}
				</div>

				<Field label="Keterangan" forId="ket" hint="Tercatat di riwayat harga">
					<Input id="ket" bind:value={keterangan} maxlength={500} />
				</Field>

				<Button
					type="submit"
					class="w-full"
					disabled={menyimpan || idsDipilih.length === 0 || !batchAcuan}
				>
					{menyimpan ? 'Menyimpan…' : `Terapkan ke ${idsDipilih.length} batch`}
				</Button>
			</Card.Root>

			<Card.Root class="gap-0 overflow-hidden border py-0 shadow-none ring-0">
				<div class="flex items-center justify-between gap-2 border-b border-primary/10 px-3 py-2">
					<p class="text-sm font-medium text-foreground">Pratinjau sebelum simpan</p>
					<Button
						variant="link"
						class="h-auto p-0 text-xs"
						type="button"
						onclick={() => setSemua(!semuaDipilih)}
					>
						{semuaDipilih ? 'Kosongkan pilihan' : 'Pilih semua'}
					</Button>
				</div>
				<div class="overflow-x-auto">
					<Table.Root>
						<Table.Header>
							<Table.Row class="hover:bg-transparent">
								<Table.Head class="px-3 py-2 text-left">Pilih</Table.Head>
								<Table.Head class="px-3 py-2 text-left">Batch</Table.Head>
								<Table.Head class="px-3 py-2 text-right">Harga list</Table.Head>
								<Table.Head class="px-3 py-2 text-right">Diskon</Table.Head>
								<Table.Head class="px-3 py-2 text-right">MT</Table.Head>
								<Table.Head class="px-3 py-2 text-right">GT</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each batches as b (b.barang_masuk_id)}
								{@const next = pratinjau(b)}
								{@const aktif = selected[b.barang_masuk_id]}
								<Table.Row class={aktif ? '' : 'opacity-50'}>
									<Table.Cell class="px-3 py-2">
										<Checkbox
											checked={!!selected[b.barang_masuk_id]}
											onCheckedChange={() => toggle(b.barang_masuk_id)}
										/>
									</Table.Cell>
									<Table.Cell class="px-3 py-2">
										<p class="font-mono text-xs">{b.no_batch}</p>
										<p class="text-xs text-muted">sisa {b.qty_tersedia}</p>
									</Table.Cell>
									<Table.Cell class="px-3 py-2 text-right tabular-nums">
										<p class={beda(b.harga, next.list) && aktif ? 'font-medium text-brand-800' : ''}>
											{formatRupiah(next.list)}
										</p>
										{#if beda(b.harga, next.list) && aktif}
											<p class="text-xs text-muted line-through">{formatRupiah(b.harga)}</p>
										{/if}
									</Table.Cell>
									<Table.Cell class="px-3 py-2 text-right text-xs tabular-nums text-muted-foreground">
										{angka(b.disc_hpp_1, '0')}% / {angka(b.disc_hpp_2, '0')}% / {angka(b.disc_hpp_3, '0')}%
										<p class="text-muted">HPP {formatRupiah(next.hpp)}</p>
									</Table.Cell>
									<Table.Cell class="px-3 py-2 text-right tabular-nums">
										<p class={beda(b.harga_mt, next.mt) && aktif ? 'font-medium text-brand-800' : ''}>
											{formatRupiah(next.mt)}
										</p>
										{#if beda(b.harga_mt, next.mt) && aktif}
											<p class="text-xs text-muted">dari {formatRupiah(b.harga_mt)}</p>
										{/if}
									</Table.Cell>
									<Table.Cell class="px-3 py-2 text-right tabular-nums">
										<p class={beda(b.harga_gt, next.gt) && aktif ? 'font-medium text-brand-800' : ''}>
											{formatRupiah(next.gt)}
										</p>
										{#if beda(b.harga_gt, next.gt) && aktif}
											<p class="text-xs text-muted">dari {formatRupiah(b.harga_gt)}</p>
										{/if}
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			</Card.Root>
		</form>
	{/if}
</div>

{#snippet rincianMarkup(channel: 'MT' | 'GT', amount: string, tipe: MarkupTipe)}
	{#if batchTerpilih.length === 0}
		<p class="text-xs text-muted">Centang batch untuk melihat persen dan rupiah markup.</p>
	{:else}
		<ul class="space-y-1">
			{#each batchTerpilih as b (b.barang_masuk_id)}
				{@const next = pratinjau(b)}
				{@const jual = channel === 'MT' ? next.mt : next.gt}
				<li class="text-xs leading-snug text-muted-foreground">
					<span class="font-mono">{b.no_batch}</span>
					· {persenMarkup(next.list, amount, tipe)}% = {formatRupiah(rupiahMarkup(next.list, amount, tipe))}
					dari list {formatRupiah(next.list)}
					· harga {channel} {formatRupiah(jual)}
				</li>
			{/each}
		</ul>
	{/if}
{/snippet}
