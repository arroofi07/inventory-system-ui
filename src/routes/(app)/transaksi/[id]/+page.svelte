<script lang="ts">
	import { page } from '$app/state';
	import Field from '$lib/components/form/Field.svelte';
	import AsyncCombobox from '$lib/components/form/AsyncCombobox.svelte';
	import CurrencyInput from '$lib/components/form/CurrencyInput.svelte';
	import NumberInput from '$lib/components/form/NumberInput.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
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

	const batchSelectOptions = $derived([
		{ value: '', label: 'FEFO' },
		...batches.map((b) => ({ value: String(b.id), label: b.label }))
	]);
	const batchSelectValue = $derived(batchId != null ? String(batchId) : '');
	const batchSelectLabel = $derived(
		batchSelectOptions.find((o) => o.value === batchSelectValue)?.label ?? 'FEFO'
	);

	function onBatchSelectChange(v: string) {
		const n = Number(v);
		batchId = n || null;
		const b = batches.find((x) => x.id === n);
		if (b) harga = b.harga;
	}

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
	<Button
		variant="link"
		class="inline-flex h-auto min-h-11 p-0 md:min-h-0"
		href={resolveAppPath('/transaksi')}
	>
		← Daftar transaksi
	</Button>

	{#if loading}
		<p class="text-sm text-primary/70">Memuat…</p>
	{:else if !trx}
		<p class="text-sm text-primary/70">Transaksi tidak ditemukan.</p>
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
					<span class="rounded bg-primary/10 px-2 py-0.5">{trx.status_approval}</span>
					<span class="rounded bg-primary/10 px-2 py-0.5">{trx.status_pembayaran}</span>
				</p>
				<p class="font-semibold">{formatRupiah(trx.total_akhir)}</p>
				{#if trx.status_approval === 'approved' && auth.punyaIzin('faktur.cetak')}
					<div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
						<Button
							variant="outline"
							class="min-h-11 sm:min-h-0 sm:border-0 sm:px-0 sm:underline"
							href={resolveAppPath(`/faktur/${trx.id}`)}
							target="_blank"
							rel="noopener"
						>
							Cetak faktur
						</Button>
						<Button
							variant="outline"
							class="min-h-11 sm:min-h-0 sm:border-0 sm:px-0 sm:underline"
							onclick={() => void unduhPdf()}
							disabled={mengunduhPdf}
						>
							{mengunduhPdf ? 'Mengunduh…' : 'Unduh PDF'}
						</Button>
					</div>
				{/if}
			</div>
		</header>

		<section class="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
			<div>
				<p class="text-primary/70">Area</p>
				<p>{trx.area}</p>
			</div>
			<div>
				<p class="text-primary/70">Alamat</p>
				<p class="break-words">{trx.alamat ?? '—'}</p>
			</div>
			<div>
				<p class="text-primary/70">DPP / PPN</p>
				<p>{formatRupiah(trx.total)} + {formatRupiah(trx.ppn_nominal)}</p>
			</div>
			<div>
				<p class="text-primary/70">Qty ditagih / keluar</p>
				<p>{trx.total_qty_ditagih ?? '—'} / {trx.total_qty_keluar ?? '—'}</p>
			</div>
		</section>

		<section class="space-y-2 md:hidden">
			{#each trx.items ?? [] as it (it.id ?? it.kode_item + String(it.urutan))}
				<Card.Root class="gap-0 border p-3 text-sm shadow-none ring-0">
					<p class="font-medium">{it.nama_item}</p>
					<p class="text-xs text-primary/70">{it.kode_item}</p>
					<dl class="mt-2 space-y-1">
						<div class="flex justify-between gap-3">
							<dt class="text-primary/70">Jumlah</dt>
							<dd>{it.jumlah}</dd>
						</div>
						<div class="flex justify-between gap-3">
							<dt class="text-primary/70">Qty keluar</dt>
							<dd>{it.total_qty_keluar}</dd>
						</div>
						<div class="flex justify-between gap-3">
							<dt class="text-primary/70">Harga</dt>
							<dd>{formatRupiah(it.harga)}</dd>
						</div>
						<div class="flex justify-between gap-3">
							<dt class="text-primary/70">Setelah disc</dt>
							<dd>{formatRupiah(it.total_after_disc ?? '0')}</dd>
						</div>
						{#if it.batch_number || it.promo_diterapkan?.length}
							<div class="flex justify-between gap-3">
								<dt class="text-primary/70">Batch / promo</dt>
								<dd class="text-right text-xs text-muted-foreground">
									{#if it.batch_number}{it.batch_number}{/if}
									{#if it.promo_diterapkan?.length}
										<div>
											{#each it.promo_diterapkan as p (p.kode_promo)}
												{p.kode_promo}{#if p.qty_bonus} (+{p.qty_bonus}){/if}
											{/each}
										</div>
									{/if}
								</dd>
							</div>
						{/if}
					</dl>
				</Card.Root>
			{/each}
		</section>

		<section class="hidden overflow-hidden rounded-[var(--radius-card)] border border-primary/20 md:block">
			<Table.Root>
				<Table.Header>
					<Table.Row class="hover:bg-transparent">
						<Table.Head class="px-3 py-2">Item</Table.Head>
						<Table.Head class="px-3 py-2">Jumlah</Table.Head>
						<Table.Head class="px-3 py-2">Qty keluar</Table.Head>
						<Table.Head class="px-3 py-2">Harga</Table.Head>
						<Table.Head class="px-3 py-2">Setelah disc</Table.Head>
						<Table.Head class="px-3 py-2">Batch / promo</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each trx.items ?? [] as it (it.id ?? it.kode_item + String(it.urutan))}
						<Table.Row>
							<Table.Cell class="px-3 py-2">
								<div class="font-medium">{it.nama_item}</div>
								<div class="text-xs text-primary/70">{it.kode_item}</div>
							</Table.Cell>
							<Table.Cell class="px-3 py-2">{it.jumlah}</Table.Cell>
							<Table.Cell class="px-3 py-2">{it.total_qty_keluar}</Table.Cell>
							<Table.Cell class="px-3 py-2">{formatRupiah(it.harga)}</Table.Cell>
							<Table.Cell class="px-3 py-2">{formatRupiah(it.total_after_disc ?? '0')}</Table.Cell>
							<Table.Cell class="px-3 py-2 text-xs text-muted-foreground">
								{#if it.batch_number}{it.batch_number}{/if}
								{#if it.promo_diterapkan?.length}
									<div>
										{#each it.promo_diterapkan as p (p.kode_promo)}
											{p.kode_promo}{#if p.qty_bonus} (+{p.qty_bonus}){/if}
										{/each}
									</div>
								{/if}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</section>

		{#if tampilTambah}
			<Card.Root class="gap-0 border border-dashed p-3 shadow-none ring-0">
				{#if !formTambahOpen}
					<Button
						class="min-h-11 w-full sm:w-auto sm:min-h-0"
						onclick={() => (formTambahOpen = true)}
					>
						Tambah item
					</Button>
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
							<Select.Root
								type="single"
								value={batchSelectValue}
								onValueChange={onBatchSelectChange}
							>
								<Select.Trigger id="add-batch" class="w-full">
									{batchSelectLabel}
								</Select.Trigger>
								<Select.Content>
									{#each batchSelectOptions as opsi (opsi.value || '__fefo__')}
										<Select.Item value={opsi.value} label={opsi.label}>{opsi.label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</Field>
						<Field label="Qty" forId="add-qty">
							<NumberInput id="add-qty" min={1} bind:value={qty} />
						</Field>
						<Field label="Harga" forId="add-hrg">
							<CurrencyInput id="add-hrg" bind:value={harga} />
						</Field>
					</div>
					<div class="mt-3 flex flex-col gap-2 sm:flex-row">
						<Button
							class="min-h-11 sm:min-h-0"
							disabled={menyimpan}
							onclick={() => void simpanTambah()}
						>
							{menyimpan ? 'Menyimpan…' : 'Simpan item'}
						</Button>
						<Button
							variant="outline"
							class="min-h-11 sm:min-h-0"
							onclick={() => (formTambahOpen = false)}
						>
							Batal
						</Button>
					</div>
				{/if}
			</Card.Root>
		{/if}
	{/if}
</div>
