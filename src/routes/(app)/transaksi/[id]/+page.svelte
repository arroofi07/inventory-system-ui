<script lang="ts">
	import { page } from '$app/state';
	import Field from '$lib/components/form/Field.svelte';
	import AsyncCombobox from '$lib/components/form/AsyncCombobox.svelte';
	import CurrencyInput from '$lib/components/form/CurrencyInput.svelte';
	import NumberInput from '$lib/components/form/NumberInput.svelte';
	import {
		detailTransaksi,
		tambahItemsTransaksi,
		type Transaksi
	} from '$lib/api/transaksi';
	import { daftarBarang, batchTersedia } from '$lib/api/barang';
	import { formatRupiah } from '$lib/domain/format';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { pergiKe, resolveAppPath } from '$lib/nav';
	import { ApiError } from '$lib/api/http';
	import { unduhFakturPdf } from '$lib/api/faktur';

	const id = $derived(Number(page.params.id));

	let trx = $state<Transaksi | null>(null);
	let loading = $state(true);
	let formTambahOpen = $state(false);
	let kodeItem = $state('');
	let harga = $state('0.00');
	let qty = $state(1);
	let batchId = $state<number | null>(null);
	let batches = $state<{ id: number; label: string; harga: string }[]>([]);
	let menyimpan = $state(false);
	let mengunduhPdf = $state(false);

	const milikSaya = $derived(
		trx?.sales?.id != null && auth.user?.id != null && trx.sales.id === auth.user.id
	);
	const tampilTambah = $derived(
		Boolean(
			trx &&
				trx.status_approval === 'pending' &&
				auth.punyaIzin('transaksi.buat') &&
				milikSaya
		)
	);

	async function muat() {
		loading = true;
		try {
			const res = await detailTransaksi(id);
			trx = res.data;
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal memuat', 'bahaya');
			trx = null;
			if (e instanceof ApiError && e.status === 404) {
				await pergiKe('/transaksi');
			}
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		void id;
		if (Number.isFinite(id) && id > 0) {
			void muat();
		}
	});

	async function unduhPdf() {
		if (mengunduhPdf) return;
		mengunduhPdf = true;
		try {
			await unduhFakturPdf(id, trx?.no_transaksi);
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal mengunduh PDF', 'bahaya');
		} finally {
			mengunduhPdf = false;
		}
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

	async function onPilihBarang(opt: { value: string } | null) {
		if (!opt || !trx) return;
		kodeItem = opt.value;
		batchId = null;
		batches = [];
		try {
			const res = await batchTersedia(opt.value, {
				channel: trx.channel_outlet,
				qty: qty || 1
			});
			batches = (res.data.batch ?? []).map((b) => ({
				id: b.barang_masuk_id,
				label: `${b.no_batch} · sisa ${b.qty_tersedia} · ${b.sisa_hari}h`,
				harga: b.harga_jual
			}));
			const first = batches[0];
			if (first) {
				batchId = first.id;
				harga = first.harga;
			}
		} catch {
			showToast('Gagal memuat batch', 'bahaya');
		}
	}

	async function simpanTambah() {
		if (!trx || menyimpan || !kodeItem.trim()) return;
		menyimpan = true;
		try {
			const item: {
				kode_item: string;
				qty: number;
				harga: string;
				barang_masuk_id?: number;
			} = {
				kode_item: kodeItem.trim(),
				qty: Number(qty) || 1,
				harga
			};
			if (batchId) item.barang_masuk_id = batchId;
			const res = await tambahItemsTransaksi(trx.id, { item });
			trx = res.data;
			formTambahOpen = false;
			kodeItem = '';
			showToast('Item ditambahkan; total dihitung ulang', 'sukses');
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal tambah item', 'bahaya');
		} finally {
			menyimpan = false;
		}
	}
</script>

<div class="space-y-4">
	<a href={resolveAppPath('/transaksi')} class="inline-flex min-h-11 items-center text-sm text-brand-700 underline md:min-h-0"
		>← Daftar transaksi</a
	>

	{#if loading}
		<p class="text-sm text-slate-500">Memuat…</p>
	{:else if !trx}
		<p class="text-sm text-slate-500">Transaksi tidak ditemukan.</p>
	{:else}
		<header class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
			<div class="min-w-0">
				<h1 class="font-display text-xl text-ink sm:text-2xl">
					Transaksi #{trx.id}
					{#if trx.no_transaksi}
						<span class="block text-base text-muted sm:inline sm:text-lg">· {trx.no_transaksi}</span>
					{/if}
				</h1>
				<p class="mt-1 text-sm text-muted">
					{trx.tanggal} · {trx.kode_pelanggan} — {trx.nama_pelanggan} · {trx.channel_outlet}
				</p>
			</div>
			<div class="flex flex-col gap-2 text-sm sm:items-end sm:text-right">
				<p class="flex flex-wrap gap-1">
					<span class="rounded bg-slate-100 px-2 py-0.5">{trx.status_approval}</span>
					<span class="rounded bg-slate-100 px-2 py-0.5">{trx.status_pembayaran}</span>
				</p>
				<p class="font-semibold">{formatRupiah(trx.total_akhir)}</p>
				{#if trx.status_approval === 'approved' && auth.punyaIzin('faktur.cetak')}
					<div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
						<a
							class="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-3 text-sm text-brand-800 sm:min-h-0 sm:border-0 sm:px-0 sm:underline"
							href={resolveAppPath(`/faktur/${trx.id}`)}
							target="_blank"
							rel="noopener"
						>
							Cetak faktur
						</a>
						<button
							type="button"
							class="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-3 text-sm text-brand-800 disabled:opacity-60 sm:min-h-0 sm:border-0 sm:px-0 sm:underline"
							onclick={() => void unduhPdf()}
							disabled={mengunduhPdf}
						>
							{mengunduhPdf ? 'Mengunduh…' : 'Unduh PDF'}
						</button>
					</div>
				{/if}
			</div>
		</header>

		<section class="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
			<div>
				<p class="text-slate-500">Area</p>
				<p>{trx.area}</p>
			</div>
			<div>
				<p class="text-slate-500">Alamat</p>
				<p class="break-words">{trx.alamat ?? '—'}</p>
			</div>
			<div>
				<p class="text-slate-500">DPP / PPN</p>
				<p>{formatRupiah(trx.total)} + {formatRupiah(trx.ppn_nominal)}</p>
			</div>
			<div>
				<p class="text-slate-500">Qty ditagih / keluar</p>
				<p>{trx.total_qty_ditagih ?? '—'} / {trx.total_qty_keluar ?? '—'}</p>
			</div>
		</section>

		<section class="space-y-2 md:hidden">
			{#each trx.items ?? [] as it (it.id ?? it.kode_item + String(it.urutan))}
				<article class="rounded-lg border border-slate-200 bg-white p-3 text-sm">
					<p class="font-medium">{it.nama_item}</p>
					<p class="text-xs text-slate-500">{it.kode_item}</p>
					<dl class="mt-2 space-y-1">
						<div class="flex justify-between gap-3">
							<dt class="text-slate-500">Jumlah</dt>
							<dd>{it.jumlah}</dd>
						</div>
						<div class="flex justify-between gap-3">
							<dt class="text-slate-500">Qty keluar</dt>
							<dd>{it.total_qty_keluar}</dd>
						</div>
						<div class="flex justify-between gap-3">
							<dt class="text-slate-500">Harga</dt>
							<dd>{formatRupiah(it.harga)}</dd>
						</div>
						<div class="flex justify-between gap-3">
							<dt class="text-slate-500">Setelah disc</dt>
							<dd>{formatRupiah(it.total_after_disc ?? '0')}</dd>
						</div>
						{#if it.batch_number || it.promo_diterapkan?.length}
							<div class="flex justify-between gap-3">
								<dt class="text-slate-500">Batch / promo</dt>
								<dd class="text-right text-xs text-slate-600">
									{#if it.batch_number}{it.batch_number}{/if}
									{#if it.promo_diterapkan?.length}
										<div>
											{#each it.promo_diterapkan as p}
												{p.kode_promo}{#if p.qty_bonus} (+{p.qty_bonus}){/if}
											{/each}
										</div>
									{/if}
								</dd>
							</div>
						{/if}
					</dl>
				</article>
			{/each}
		</section>

		<section class="hidden overflow-x-auto rounded-lg border border-slate-200 md:block">
			<table class="min-w-full text-left text-sm">
				<thead class="bg-slate-50 text-slate-600">
					<tr>
						<th class="px-3 py-2">Item</th>
						<th class="px-3 py-2">Jumlah</th>
						<th class="px-3 py-2">Qty keluar</th>
						<th class="px-3 py-2">Harga</th>
						<th class="px-3 py-2">Setelah disc</th>
						<th class="px-3 py-2">Batch / promo</th>
					</tr>
				</thead>
				<tbody>
					{#each trx.items ?? [] as it (it.id ?? it.kode_item + String(it.urutan))}
						<tr class="border-t border-slate-100">
							<td class="px-3 py-2">
								<div class="font-medium">{it.nama_item}</div>
								<div class="text-xs text-slate-500">{it.kode_item}</div>
							</td>
							<td class="px-3 py-2">{it.jumlah}</td>
							<td class="px-3 py-2">{it.total_qty_keluar}</td>
							<td class="px-3 py-2">{formatRupiah(it.harga)}</td>
							<td class="px-3 py-2">{formatRupiah(it.total_after_disc ?? '0')}</td>
							<td class="px-3 py-2 text-xs text-slate-600">
								{#if it.batch_number}{it.batch_number}{/if}
								{#if it.promo_diterapkan?.length}
									<div>
										{#each it.promo_diterapkan as p}
											{p.kode_promo}{#if p.qty_bonus} (+{p.qty_bonus}){/if}
										{/each}
									</div>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</section>

		{#if tampilTambah}
			<div class="rounded-lg border border-dashed border-slate-300 p-3">
				{#if !formTambahOpen}
					<button
						type="button"
						class="min-h-11 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm text-white sm:w-auto sm:min-h-0"
						onclick={() => (formTambahOpen = true)}>Tambah item</button
					>
				{:else}
					<div class="grid gap-3 md:grid-cols-4">
						<Field label="Produk" required forId="add-brg">
							<AsyncCombobox
								id="add-brg"
								bind:value={kodeItem}
								placeholder="Cari produk…"
								onsearch={cariBarang}
								onchange={(o) => void onPilihBarang(o)}
							/>
						</Field>
						<Field label="Batch" forId="add-batch">
							<select
								id="add-batch"
								class="w-full rounded-lg border px-3 py-2 text-sm"
								value={batchId ?? ''}
								onchange={(e) => {
									const v = Number((e.currentTarget as HTMLSelectElement).value);
									batchId = v || null;
									const b = batches.find((x) => x.id === v);
									if (b) harga = b.harga;
								}}
							>
								<option value="">FEFO</option>
								{#each batches as b (b.id)}
									<option value={b.id}>{b.label}</option>
								{/each}
							</select>
						</Field>
						<Field label="Qty" forId="add-qty">
							<NumberInput id="add-qty" min={1} bind:value={qty} />
						</Field>
						<Field label="Harga" forId="add-hrg">
							<CurrencyInput id="add-hrg" bind:value={harga} />
						</Field>
					</div>
					<div class="mt-3 flex flex-col gap-2 sm:flex-row">
						<button
							type="button"
							class="min-h-11 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50 sm:min-h-0 sm:py-1.5"
							disabled={menyimpan}
							onclick={() => void simpanTambah()}
						>
							{menyimpan ? 'Menyimpan…' : 'Simpan item'}
						</button>
						<button
							type="button"
							class="min-h-11 rounded-lg border px-3 py-2 text-sm sm:min-h-0 sm:py-1.5"
							onclick={() => (formTambahOpen = false)}>Batal</button
						>
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>
