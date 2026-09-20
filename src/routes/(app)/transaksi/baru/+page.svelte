<script lang="ts">
	import Field from '$lib/components/form/Field.svelte';
	import AsyncCombobox from '$lib/components/form/AsyncCombobox.svelte';
	import CurrencyInput from '$lib/components/form/CurrencyInput.svelte';
	import NumberInput from '$lib/components/form/NumberInput.svelte';
	import PercentInput from '$lib/components/form/PercentInput.svelte';
	import StokKurangModal from '$lib/components/transaksi/StokKurangModal.svelte';
	import RiwayatOutletModal from '$lib/components/transaksi/RiwayatOutletModal.svelte';
	import InfoBatchTerpilih from '$lib/components/transaksi/InfoBatchTerpilih.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { daftarBarang, batchTersedia, type BatchTersediaItem } from '$lib/api/barang';
	import { daftarPelanggan, detailPelanggan, type Pelanggan } from '$lib/api/pelanggan';
	import { daftarPromo } from '$lib/api/promo';
	import {
		buatTransaksi,
		pratinjauTransaksi,
		type CekStokItem,
		type PratinjauResult,
		type TransaksiItemPayload
	} from '$lib/api/transaksi';
	import { ApiError } from '$lib/api/http';
	import { hitungTotalKasar } from '$lib/domain/preview';
	import { formatRupiah } from '$lib/domain/format';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { pergiKe, resolveAppPath } from '$lib/nav';
	import { onMount } from 'svelte';

	type BarisForm = {
		key: string;
		kode_item: string;
		nama_item: string;
		qty: number;
		harga: string;
		disc1: string;
		disc2: string;
		disc3: string;
		barang_masuk_id: number | null;
		batchLabel: string;
		batches: BatchTersediaItem[];
		metodeAlokasi: string;
		satuan: string;
		tampilkanInfo: boolean;
		promo1: string;
		promo2: string;
		promo3: string;
	};

	function barisKosong(): BarisForm {
		return {
			key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
			kode_item: '',
			nama_item: '',
			qty: 1,
			harga: '0.00',
			disc1: '0.00',
			disc2: '0.00',
			disc3: '0.00',
			barang_masuk_id: null,
			batchLabel: '',
			batches: [],
			metodeAlokasi: 'FEFO',
			satuan: 'unit',
			tampilkanInfo: true,
			promo1: '',
			promo2: '',
			promo3: ''
		};
	}

	let pelangganKode = $state('');
	let pelangganNama = $state('');
	let channel = $state('');
	let area = $state('');
	let tanggal = $state(new Date().toISOString().slice(0, 10));
	let disc1G = $state('0.00');
	let disc2G = $state('0.00');
	let disc3G = $state('0.00');
	let ppn = $state('11.00');
	let nominalDibayar = $state('0.00');
	let tjt = $state('');
	let ketBayar = $state('');
	let items = $state<BarisForm[]>([barisKosong()]);

	let pratinjau = $state<PratinjauResult | null>(null);
	let loadingPratinjau = $state(false);
	let menyimpan = $state(false);
	let errors = $state<Record<string, string>>({});

	let stokModalOpen = $state(false);
	let stokItems = $state<CekStokItem[]>([]);
	let stokCatatan = $state('');
	let lanjutSetelahStok = $state<null | (() => void)>(null);

	let riwayatOpen = $state(false);

	const kasar = $derived(
		hitungTotalKasar({
			items: items.map((b) => ({
				qty: b.qty,
				harga: b.harga,
				disc1: b.disc1,
				disc2: b.disc2,
				disc3: b.disc3
			})),
			disc1Global: disc1G,
			disc2Global: disc2G,
			disc3Global: disc3G,
			ppnPersen: ppn
		})
	);

	onMount(() => {
		if (!auth.punyaIzin('transaksi.buat')) {
			showToast('Tidak berwenang membuat transaksi', 'bahaya');
			void pergiKe('/transaksi');
		}
	});

	async function cariPelanggan(q: string) {
		const res = await daftarPelanggan({ q: q || undefined, per_page: 12, page: 1 });
		return res.data.map((p) => ({
			value: p.kode_pelanggan,
			label: `${p.kode_pelanggan} — ${p.nama_pelanggan}`,
			hint: String(p.channel_outlet)
		}));
	}

	async function onPilihPelanggan(opt: { value: string; label: string } | null) {
		if (!opt) {
			pelangganKode = '';
			pelangganNama = '';
			channel = '';
			return;
		}
		pelangganKode = opt.value;
		try {
			const res = await detailPelanggan(opt.value);
			const p: Pelanggan = res.data;
			pelangganNama = p.nama_pelanggan;
			channel = String(p.channel_outlet);
			if (!area.trim()) area = p.territory || p.distrik || '';
		} catch {
			pelangganNama = opt.label;
		}
		pratinjau = null;
	}

	async function cariBarang(q: string) {
		const res = await daftarBarang({
			q: q || undefined,
			popular: !q,
			per_page: 12,
			page: 1,
			with_stock: true
		});
		return res.data.map((b) => ({
			value: b.kode_barang,
			label: `${b.kode_barang} — ${b.nama_item}`,
			hint: `stok ${b.stok_tersedia}`
		}));
	}

	function infoChannel(ch: string) {
		const mt = ch.toLowerCase().includes('modern trade');
		return {
			singkat: mt ? 'MT' : 'GT',
			penuh: mt ? 'Modern Trade' : 'General Trade'
		};
	}

	function batchAktif(row: BarisForm): BatchTersediaItem | null {
		if (row.barang_masuk_id) {
			return row.batches.find((b) => b.barang_masuk_id === row.barang_masuk_id) ?? null;
		}
		return row.batches[0] ?? null;
	}

	function terapkanBatch(row: BarisForm, b: BatchTersediaItem) {
		row.barang_masuk_id = b.barang_masuk_id;
		row.harga = b.harga_jual;
		row.batchLabel = `${b.no_batch} · sisa ${b.qty_tersedia} · ${b.sisa_hari}h`;
	}

	async function muatBatchBaris(idx: number, resetBatch = true) {
		const row = items[idx];
		if (!row?.kode_item.trim()) return;
		try {
			const res = await batchTersedia(row.kode_item.trim(), {
				channel: channel || undefined,
				qty: row.qty || 1
			});
			row.batches = res.data.batch ?? [];
			row.metodeAlokasi = res.data.metode_alokasi ?? 'FEFO';
			row.satuan = res.data.satuan ?? 'unit';
			if (resetBatch) {
				row.barang_masuk_id = null;
			}
			const pilih =
				(row.barang_masuk_id
					? row.batches.find((b) => b.barang_masuk_id === row.barang_masuk_id)
					: null) ?? row.batches[0];
			if (pilih) {
				terapkanBatch(row, pilih);
			} else {
				row.barang_masuk_id = null;
				row.batchLabel = '';
			}
			items = [...items];
			pratinjau = null;
		} catch {
			showToast('Gagal memuat batch', 'bahaya');
		}
	}

	async function onPilihBarang(idx: number, opt: { value: string; label: string } | null) {
		const row = items[idx];
		if (!row || !opt) return;
		row.kode_item = opt.value;
		row.nama_item = opt.label;
		row.barang_masuk_id = null;
		row.batchLabel = '';
		row.batches = [];
		await muatBatchBaris(idx);
	}

	function onQtyBerubah(idx: number) {
		const row = items[idx];
		if (!row?.kode_item.trim()) return;
		void muatBatchBaris(idx, false);
	}

	function pilihBatch(idx: number, idStr: string) {
		const row = items[idx];
		if (!row) return;
		if (!idStr) {
			row.barang_masuk_id = null;
			const first = row.batches[0];
			if (first) terapkanBatch(row, first);
			items = [...items];
			pratinjau = null;
			return;
		}
		const id = Number(idStr);
		const b = row.batches.find((x) => x.barang_masuk_id === id);
		if (!b) return;
		terapkanBatch(row, b);
		items = [...items];
		pratinjau = null;
	}

	function tambahBaris() {
		items = [...items, barisKosong()];
	}

	function hapusBaris(idx: number) {
		if (items.length <= 1) return;
		items = items.filter((_, i) => i !== idx);
		pratinjau = null;
	}

	function payloadItems(): TransaksiItemPayload[] {
		return items
			.filter((b) => b.kode_item.trim() && b.qty > 0)
			.map((b) => {
				const promos = [b.promo1, b.promo2, b.promo3]
					.map((p) => p.trim())
					.filter(Boolean)
					.slice(0, 3);
				const body: TransaksiItemPayload = {
					kode_item: b.kode_item.trim(),
					qty: Number(b.qty) || 1,
					harga: b.harga || '0.00',
					disc1_persen: b.disc1,
					disc2_persen: b.disc2,
					disc3_persen: b.disc3
				};
				if (promos.length) body.kode_promos = promos;
				if (b.barang_masuk_id) body.barang_masuk_id = b.barang_masuk_id;
				return body;
			});
	}

	async function jalankanPratinjau(): Promise<PratinjauResult | null> {
		errors = {};
		if (!pelangganKode.trim()) {
			errors = { kode_pelanggan: 'Wajib dipilih' };
			showToast('Pilih pelanggan', 'bahaya');
			return null;
		}
		const list = payloadItems();
		if (!list.length) {
			showToast('Minimal satu item', 'bahaya');
			return null;
		}
		loadingPratinjau = true;
		try {
			const res = await pratinjauTransaksi({
				kode_pelanggan: pelangganKode.trim(),
				tanggal,
				items: list,
				disc1_persen: disc1G,
				disc2_persen: disc2G,
				disc3_persen: disc3G,
				ppn_persen: ppn
			});
			pratinjau = res.data;
			return res.data;
		} catch (e) {
			if (e instanceof ApiError) {
				if (e.body.details?.length) {
					const next: Record<string, string> = {};
					for (const d of e.body.details) next[d.field] = d.message;
					errors = next;
				}
				showToast(e.body.message, 'bahaya');
			} else {
				showToast('Pratinjau gagal', 'bahaya');
			}
			return null;
		} finally {
			loadingPratinjau = false;
		}
	}

	async function sebelumSubmit(lanjut: () => void) {
		const p = pratinjau ?? (await jalankanPratinjau());
		if (!p) return;
		if (!p.semua_stok_cukup) {
			stokItems = p.items.map((it) => ({
				kode_item: it.kode_item,
				nama_item: it.nama_item,
				qty_diminta: it.total_qty_keluar,
				stok_tersedia: it.stok_tersedia,
				stok_cukup: it.stok_cukup,
				batch: []
			}));
			stokCatatan =
				'Soft-check dari pratinjau. Store akan menolak bila stok jelas tidak cukup.';
			lanjutSetelahStok = lanjut;
			stokModalOpen = true;
			return;
		}
		lanjut();
	}

	async function simpan() {
		if (menyimpan) return;
		if (!area.trim()) {
			errors = { area: 'Wajib diisi' };
			showToast('Area wajib', 'bahaya');
			return;
		}
		const list = payloadItems();
		menyimpan = true;
		try {
			const body = {
				kode_pelanggan: pelangganKode.trim(),
				tanggal,
				area: area.trim(),
				items: list,
				disc1_persen: disc1G,
				disc2_persen: disc2G,
				disc3_persen: disc3G,
				ppn_persen: ppn,
				nominal_dibayar: nominalDibayar,
				tanggal_jatuh_tempo: tjt.trim() || null,
				keterangan_pembayaran: ketBayar.trim()
			};
			const res = await buatTransaksi(body);
			showToast(`Transaksi #${res.data.id} tersimpan (pending)`, 'sukses');
			await pergiKe(`/transaksi/${res.data.id}`);
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

	async function cariPromo(q: string) {
		const res = await daftarPromo({ q: q || undefined, aktif: true, per_page: 10, page: 1 });
		return res.data.map((p) => ({
			value: p.kode_promo,
			label: `${p.kode_promo} — ${p.nama_promo}`
		}));
	}
</script>

<div class="space-y-4 pb-24 md:pb-0">
	<Button
		variant="link"
		class="inline-flex h-auto min-h-11 p-0 md:min-h-0"
		href={resolveAppPath('/transaksi')}
	>
		← Daftar transaksi
	</Button>
	<header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
		<div class="hidden md:block">
			<h1 class="font-display text-2xl text-ink">Transaksi baru</h1>
			<p class="text-sm text-muted">
				Angka resmi dari pratinjau server. Estimasi browser hanya bantuan.
			</p>
		</div>
		<p class="text-sm text-muted md:hidden">
			Angka resmi dari pratinjau server. Estimasi browser hanya bantuan.
		</p>
		{#if pelangganKode}
			<Button
				variant="outline"
				class="min-h-11 sm:min-h-0"
				onclick={() => (riwayatOpen = true)}
			>
				Riwayat outlet
			</Button>
		{/if}
	</header>

	<section class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
		<Field label="Pelanggan" required forId="plg" error={errors.kode_pelanggan}>
			<AsyncCombobox
				id="plg"
				bind:value={pelangganKode}
				placeholder="Cari pelanggan…"
				onsearch={cariPelanggan}
				onchange={onPilihPelanggan}
			/>
		</Field>
		<Field label="Channel" forId="ch">
			<Input id="ch" class="bg-background" value={channel} readonly />
		</Field>
		<Field label="Area" required forId="area" error={errors.area}>
			<Input id="area" bind:value={area} />
		</Field>
		<Field label="Tanggal" required forId="tgl">
			<Input id="tgl" type="date" bind:value={tanggal} />
		</Field>
		<Field label="Disc1 global %" forId="d1g">
			<PercentInput id="d1g" class="w-full" bind:value={disc1G} />
		</Field>
		<Field label="PPN %" forId="ppn">
			<PercentInput id="ppn" class="w-full" bind:value={ppn} max={100} />
		</Field>
	</section>

	<section class="space-y-4">
		<div class="flex items-center justify-between">
			<h2 class="text-sm font-semibold text-foreground">Tambah barang</h2>
			<Button
				variant="link"
				class="h-auto min-h-11 p-0 md:min-h-0"
				onclick={tambahBaris}
			>
				+ Baris item
			</Button>
		</div>

		{#each items as row, idx (row.key)}
			{@const batchInfo = batchAktif(row)}
			{@const ch = infoChannel(channel)}
			<div class="space-y-3 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 p-4">
				<header class="space-y-1">
					<h3 class="flex items-center gap-2 font-semibold text-emerald-900">
						<span class="text-lg leading-none" aria-hidden="true">+</span>
						Tambah Barang
					</h3>
					<p class="text-xs text-emerald-900/70">
						Pilih barang dan tambahkan ke transaksi (tidak ada batasan jumlah barang)
					</p>
				</header>

				<div class="grid gap-3 lg:grid-cols-12 lg:items-start">
					<div class="lg:col-span-6">
						<Field label="Pilih barang" required forId={`brg-${idx}`}>
							<AsyncCombobox
								id={`brg-${idx}`}
								bind:value={row.kode_item}
								placeholder="Ketik kode barang, nama, atau brand…"
								onsearch={cariBarang}
								onchange={(opt) => void onPilihBarang(idx, opt)}
							/>
						</Field>
					</div>
					<div class="lg:col-span-2">
						<Field label="Qty" required forId={`qty-${idx}`}>
							<NumberInput
								id={`qty-${idx}`}
								min={1}
								bind:value={row.qty}
								onchange={() => onQtyBerubah(idx)}
							/>
						</Field>
					</div>
					<div class="lg:col-span-4">
						<Field label="Harga auto" forId={`hrg-${idx}`}>
							<Input
								id={`hrg-${idx}`}
								class="font-mono tabular-nums"
								value={row.harga && row.harga !== '0.00'
									? formatRupiah(row.harga, { tanpaSimbol: true })
									: ''}
								readonly
								tabindex={-1}
							/>
							{#if batchInfo && channel}
								<p class="mt-1 flex flex-wrap items-center gap-2 text-xs text-emerald-800">
									<span aria-hidden="true">✓</span>
									Harga untuk {ch.penuh}: {formatRupiah(batchInfo.harga_jual)}
									<span
										class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase {ch.singkat ===
										'MT'
											? 'bg-violet-100 text-violet-800'
											: 'bg-amber-100 text-amber-800'}"
									>
										{ch.singkat} ({ch.penuh})
									</span>
								</p>
							{/if}
						</Field>
					</div>
				</div>

				<div class="flex flex-wrap items-center gap-2">
					{#if row.batches.length > 1}
						{@const batchVal = row.barang_masuk_id != null ? String(row.barang_masuk_id) : ''}
						{@const batchOpts = [
							{ value: '', label: `Otomatis ${row.metodeAlokasi}` },
							...row.batches.map((b) => ({
								value: String(b.barang_masuk_id),
								label: `${b.no_batch} · sisa ${b.qty_tersedia}`
							}))
						]}
						{@const batchLabel =
							batchOpts.find((o) => o.value === batchVal)?.label ??
							`Otomatis ${row.metodeAlokasi}`}
						<label class="flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
							<span class="shrink-0">Ganti batch:</span>
							<Select.Root
								type="single"
								value={batchVal}
								onValueChange={(v) => pilihBatch(idx, v)}
							>
								<Select.Trigger class="h-7 min-w-[12rem] text-xs">
									{batchLabel}
								</Select.Trigger>
								<Select.Content>
									{#each batchOpts as opsi (opsi.value || '__auto__')}
										<Select.Item value={opsi.value} label={opsi.label}>{opsi.label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</label>
					{/if}
					{#if batchInfo}
						<Button
							variant="outline"
							size="sm"
							class="ml-auto border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100"
							onclick={() => {
								row.tampilkanInfo = !row.tampilkanInfo;
								items = [...items];
							}}
						>
							{row.tampilkanInfo ? 'Sembunyikan info' : 'Tampilkan info'}
						</Button>
					{/if}
				</div>

				{#if batchInfo && row.tampilkanInfo}
					<InfoBatchTerpilih
						batch={batchInfo}
						{channel}
						metodeAlokasi={row.metodeAlokasi}
						satuan={row.satuan}
					/>
				{/if}

				<details class="rounded-lg border border-primary/20 bg-white/80 p-3">
					<summary class="cursor-pointer text-xs font-medium text-foreground">
						Diskon & promo baris
					</summary>
					<div class="mt-3 grid gap-2 md:grid-cols-3 lg:grid-cols-6">
						<Field label="Disc1 %" forId={`d1-${idx}`}>
							<PercentInput id={`d1-${idx}`} class="w-full" bind:value={row.disc1} />
						</Field>
						<Field label="Disc2 %" forId={`d2-${idx}`}>
							<PercentInput id={`d2-${idx}`} class="w-full" bind:value={row.disc2} />
						</Field>
						<Field label="Disc3 %" forId={`d3-${idx}`}>
							<PercentInput id={`d3-${idx}`} class="w-full" bind:value={row.disc3} />
						</Field>
						<Field label="Promo 1" forId={`p1-${idx}`}>
							<AsyncCombobox
								id={`p1-${idx}`}
								bind:value={row.promo1}
								placeholder="Kode promo"
								onsearch={cariPromo}
							/>
						</Field>
						<Field label="Promo 2" forId={`p2-${idx}`}>
							<AsyncCombobox
								id={`p2-${idx}`}
								bind:value={row.promo2}
								placeholder="Opsional"
								onsearch={cariPromo}
							/>
						</Field>
						<Field label="Promo 3" forId={`p3-${idx}`}>
							<AsyncCombobox
								id={`p3-${idx}`}
								bind:value={row.promo3}
								placeholder="Opsional"
								onsearch={cariPromo}
							/>
						</Field>
					</div>
				</details>

				{#if items.length > 1}
					<Button
						variant="link"
						class="h-auto p-0 text-xs text-destructive"
						onclick={() => hapusBaris(idx)}
					>
						Hapus baris
					</Button>
				{/if}
			</div>
		{/each}
	</section>

	<section class="grid gap-4 md:grid-cols-3">
		<Field label="Nominal dibayar" forId="bayar">
			<CurrencyInput id="bayar" bind:value={nominalDibayar} />
		</Field>
		<Field label="Jatuh tempo" forId="tjt">
			<Input id="tjt" type="date" bind:value={tjt} />
		</Field>
		<Field label="Keterangan bayar" forId="ket">
			<Input id="ket" bind:value={ketBayar} />
		</Field>
	</section>

	<Card.Root class="gap-0 border bg-primary/5 p-4 text-sm shadow-none ring-0">
		<div class="grid gap-2 sm:grid-cols-2">
			<div>
				<p class="font-medium text-foreground">Estimasi browser (kasar)</p>
				<p>Total akhir ≈ {formatRupiah(kasar.totalAkhir)}</p>
			</div>
			<div>
				<p class="font-medium text-foreground">Pratinjau server</p>
				{#if pratinjau}
					<p>Total (DPP) {formatRupiah(pratinjau.ringkasan.total)}</p>
					<p>PPN {formatRupiah(pratinjau.ringkasan.ppn_nominal)}</p>
					<p class="font-semibold">
						Total akhir {formatRupiah(pratinjau.ringkasan.total_akhir)}
					</p>
					{#if !pratinjau.semua_stok_cukup}
						<p class="text-amber-700">Ada baris stok kurang</p>
					{/if}
				{:else}
					<p class="text-primary/70">Belum dijalankan</p>
				{/if}
			</div>
		</div>
	</Card.Root>

	<div
		class="sticky bottom-0 z-10 -mx-4 mt-4 border-t border-primary/20 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0"
	>
		<div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
			<Button
				variant="outline"
				class="min-h-11 sm:min-h-0"
				disabled={loadingPratinjau || menyimpan}
				onclick={() => void jalankanPratinjau()}
			>
				{loadingPratinjau ? 'Menghitung…' : 'Pratinjau'}
			</Button>
			<Button
				class="min-h-11 font-semibold sm:min-h-0"
				disabled={menyimpan || loadingPratinjau}
				onclick={() => void sebelumSubmit(() => void simpan())}
			>
				{menyimpan ? 'Menyimpan…' : 'Simpan pending'}
			</Button>
		</div>
	</div>
</div>

<StokKurangModal
	bind:open={stokModalOpen}
	items={stokItems}
	catatan={stokCatatan}
	onkurangi={() => {
		lanjutSetelahStok = null;
	}}
	onlanjut={() => {
		const fn = lanjutSetelahStok;
		lanjutSetelahStok = null;
		fn?.();
	}}
/>

<RiwayatOutletModal bind:open={riwayatOpen} kodePelanggan={pelangganKode} namaPelanggan={pelangganNama} />
