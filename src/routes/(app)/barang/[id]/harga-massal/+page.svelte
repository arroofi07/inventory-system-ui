<script lang="ts">
	import { page } from '$app/state';
	import Field from '$lib/components/form/Field.svelte';
	import CurrencyInput from '$lib/components/form/CurrencyInput.svelte';
	import { daftarBatch, detailBarang, type BatchListItem, type Barang } from '$lib/api/barang';
	import { hargaMassal } from '$lib/api/harga';
	import { ApiError } from '$lib/api/http';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { pergiKe, resolveAppPath } from '$lib/nav';
	import { formatRupiah } from '$lib/domain/format';
	import { onMount } from 'svelte';

	const id = $derived(Number(page.params.id));

	let barang = $state<Barang | null>(null);
	let batches = $state<BatchListItem[]>([]);
	let selected = $state<Record<number, boolean>>({});
	let markupMtAmt = $state('15.00');
	let markupGtAmt = $state('10.00');
	let markupMtType = $state<'percent' | 'value'>('percent');
	let markupGtType = $state<'percent' | 'value'>('percent');
	let harga = $state('0.00');
	let keterangan = $state('');
	let loading = $state(true);
	let menyimpan = $state(false);

	onMount(() => {
		if (!auth.punyaIzin('harga.kelola')) {
			showToast('Hanya super_admin yang boleh ubah harga massal', 'bahaya');
			void pergiKe(`/barang/${id}`);
		}
	});

	$effect(() => {
		const barangId = id;
		if (!Number.isFinite(barangId) || barangId <= 0) return;
		loading = true;
		void Promise.all([detailBarang(barangId), daftarBatchById(barangId)])
			.then(([d, b]) => {
				barang = d.data;
				batches = b;
				const next: Record<number, boolean> = {};
				for (const row of b) next[row.barang_masuk_id] = true;
				selected = next;
				if (b[0]) harga = b[0].harga;
			})
			.catch((e) => {
				showToast(e instanceof ApiError ? e.body.message : 'Gagal memuat', 'bahaya');
			})
			.finally(() => {
				loading = false;
			});
	});

	async function daftarBatchById(barangId: number) {
		const d = await detailBarang(barangId);
		const res = await daftarBatch(d.data.kode_barang);
		return res.data;
	}

	const idsDipilih = $derived(
		batches.filter((b) => selected[b.barang_masuk_id]).map((b) => b.barang_masuk_id)
	);

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
			if (harga.trim()) body.harga = harga;
			const res = await hargaMassal(id, body);
			showToast(
				`${res.data.jumlah_batch_diperbarui} batch diperbarui · bulk ${res.data.bulk_operation_id.slice(0, 8)}…`,
				'sukses'
			);
			await pergiKe(`/barang/${id}/riwayat-harga`);
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal menyimpan', 'bahaya');
		} finally {
			menyimpan = false;
		}
	}
</script>

<div class="space-y-4">
	<a href={resolveAppPath(`/barang/${id}`)} class="text-sm text-brand-700 underline"
		>← Kembali ke detail</a
	>
	<header>
		<h1 class="font-display text-2xl text-ink">Harga massal</h1>
		<p class="text-sm text-muted">
			{#if barang}{barang.kode_barang} — {barang.nama_item}{:else}…{/if}
		</p>
		<p class="text-xs text-muted">
			Satu operasi memakai satu <code class="font-mono">bulk_operation_id</code>. Harga jual dihitung
			server.
		</p>
	</header>

	{#if loading}
		<p class="text-sm text-muted">Memuat batch…</p>
	{:else}
		<div class="overflow-hidden rounded-[var(--radius-card)] border border-slate-200 bg-white">
			<table class="min-w-full text-sm">
				<thead class="bg-surface text-xs uppercase text-muted">
					<tr>
						<th class="px-3 py-2 text-left">Pilih</th>
						<th class="px-3 py-2 text-left">Batch</th>
						<th class="px-3 py-2 text-right">Harga</th>
						<th class="px-3 py-2 text-right">MT</th>
						<th class="px-3 py-2 text-right">GT</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each batches as b (b.barang_masuk_id)}
						<tr>
							<td class="px-3 py-2">
								<input type="checkbox" bind:checked={selected[b.barang_masuk_id]} />
							</td>
							<td class="px-3 py-2 font-mono text-xs">{b.no_batch}</td>
							<td class="px-3 py-2 text-right tabular-nums"
								>{formatRupiah(b.harga, { tanpaSimbol: true })}</td
							>
							<td class="px-3 py-2 text-right tabular-nums"
								>{formatRupiah(b.harga_mt, { tanpaSimbol: true })}</td
							>
							<td class="px-3 py-2 text-right tabular-nums"
								>{formatRupiah(b.harga_gt, { tanpaSimbol: true })}</td
							>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<form
			class="grid max-w-xl gap-3"
			onsubmit={(e) => {
				e.preventDefault();
				void simpan();
			}}
		>
			<Field label="Harga list (opsional)" forId="harga">
				<CurrencyInput id="harga" bind:value={harga} />
			</Field>
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
					<CurrencyInput bind:value={markupMtAmt} />
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
					<CurrencyInput bind:value={markupGtAmt} />
				</div>
			</div>
			<Field label="Keterangan" forId="ket">
				<input
					id="ket"
					class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
					bind:value={keterangan}
					maxlength={500}
				/>
			</Field>
			<button
				type="submit"
				class="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-50"
				disabled={menyimpan || idsDipilih.length === 0}
			>
				{menyimpan ? 'Menyimpan…' : `Terapkan ke ${idsDipilih.length} batch`}
			</button>
		</form>
	{/if}
</div>
