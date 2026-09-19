<script lang="ts">
	import type { Faktur, FakturItem } from '$lib/api/faktur';
	import { formatRupiah } from '$lib/domain/format';

	interface Props {
		faktur: Faktur;
		items?: FakturItem[];
		tampilRingkasan?: boolean;
		tampilTandaTangan?: boolean;
		subtotalHalaman?: string | null;
		halamanKe?: number;
		totalHalaman?: number;
	}

	let {
		faktur,
		items = faktur.items,
		tampilRingkasan = true,
		tampilTandaTangan = true,
		subtotalHalaman = null,
		halamanKe,
		totalHalaman
	}: Props = $props();

	const layoutClass = $derived(
		faktur.layout === 'half' ? 'faktur-half' : faktur.layout === 'full' ? 'faktur-full' : 'faktur-halaman'
	);
</script>

<article class="faktur-dokumen {layoutClass} mx-auto bg-white text-ink">
	{#if faktur.cetak_ulang}
		<div class="mb-2 border border-amber-700 bg-amber-50 px-2 py-1 text-center text-xs font-bold tracking-wide text-amber-900">
			CETAK ULANG
		</div>
	{/if}

	<header class="mb-3 border-b border-slate-300 pb-2">
		<p class="font-display text-xl font-semibold">{faktur.perusahaan.nama || '—'}</p>
		{#if faktur.perusahaan.alamat}
			<p class="text-xs text-slate-600">{faktur.perusahaan.alamat}</p>
		{/if}
		<p class="text-xs text-slate-600">
			{#if faktur.perusahaan.telepon}Telp. {faktur.perusahaan.telepon}{/if}
			{#if faktur.perusahaan.npwp}
				<span class="ml-2">NPWP {faktur.perusahaan.npwp}</span>
			{/if}
		</p>
		<div class="mt-2 flex flex-wrap justify-between gap-2 text-sm">
			<div>
				<p class="font-semibold">FAKTUR PENJUALAN</p>
				<p>
					No.
					<span class="font-mono tracking-wider">{faktur.no_transaksi ?? '—'}</span>
				</p>
				<p>Tanggal {faktur.tanggal}</p>
			</div>
			<div class="text-right">
				<p class="font-medium">{faktur.pelanggan.nama_pelanggan}</p>
				<p class="text-xs">{faktur.pelanggan.kode_pelanggan} · {faktur.pelanggan.channel_outlet}</p>
				<p class="max-w-xs text-xs text-slate-600">{faktur.pelanggan.alamat}</p>
			</div>
		</div>
		{#if halamanKe != null && totalHalaman != null}
			<p class="mt-1 text-right text-xs text-slate-500">Halaman {halamanKe} / {totalHalaman}</p>
		{/if}
	</header>

	<table class="faktur-tabel w-full border-collapse text-xs">
		<thead>
			<tr class="border-b border-slate-400 text-left">
				<th class="py-1 pr-1">#</th>
				<th class="py-1 pr-1">Item</th>
				<th class="py-1 pr-1">Batch</th>
				<th class="py-1 pr-1 text-right">Qty</th>
				<th class="py-1 pr-1 text-right">Harga</th>
				<th class="py-1 text-right">Total</th>
			</tr>
		</thead>
		<tbody>
			{#each items as it (it.urutan)}
				<tr class="border-b border-slate-100 align-top">
					<td class="py-1 pr-1 tabular-nums">{it.urutan}</td>
					<td class="py-1 pr-1">
						<span class:font-medium={!it.is_bonus}>{it.nama_item}</span>
						{#if it.is_bonus}
							<span class="ml-1 text-[10px] uppercase text-slate-500">bonus</span>
						{/if}
						<div class="text-[10px] text-slate-500">{it.kode_item}</div>
					</td>
					<td class="py-1 pr-1 whitespace-nowrap">
						{it.no_batch ?? '—'}
						{#if it.exp}
							<div class="text-[10px] text-slate-500">{it.exp}</div>
						{/if}
					</td>
					<td class="py-1 pr-1 text-right tabular-nums">{it.qty} {it.satuan}</td>
					<td class="py-1 pr-1 text-right tabular-nums">{formatRupiah(it.harga)}</td>
					<td class="py-1 text-right tabular-nums font-medium"
						>{formatRupiah(it.total_final_baris)}</td
					>
				</tr>
			{/each}
		</tbody>
	</table>

	{#if subtotalHalaman}
		<p class="mt-2 text-right text-sm">
			Subtotal halaman: <span class="tabular-nums font-semibold">{formatRupiah(subtotalHalaman)}</span>
		</p>
	{/if}

	{#if tampilRingkasan}
		<section class="mt-4 grid gap-3 border-t border-slate-300 pt-3 text-sm sm:grid-cols-2">
			<div>
				<p class="text-xs text-slate-500">Terbilang</p>
				<p class="italic">{faktur.ringkasan.terbilang}</p>
				{#if faktur.sales}
					<p class="mt-2 text-xs">Sales: {faktur.sales.name}</p>
				{/if}
			</div>
			<div class="space-y-1 text-right tabular-nums">
				<p>DPP {formatRupiah(faktur.ringkasan.total)}</p>
				<p>PPN {faktur.ringkasan.ppn_persen}% {formatRupiah(faktur.ringkasan.ppn_nominal)}</p>
				<p class="text-base font-semibold">
					Total {formatRupiah(faktur.ringkasan.total_akhir)}
				</p>
			</div>
		</section>
	{/if}

	{#if tampilTandaTangan}
		<footer class="faktur-tanda-tangan mt-8 grid grid-cols-3 gap-4 text-center text-xs">
			<div>
				<p class="mb-12">Penerima</p>
				<p class="border-t border-slate-400 pt-1">(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</p>
			</div>
			<div>
				<p class="mb-12">Pengirim</p>
				<p class="border-t border-slate-400 pt-1">(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</p>
			</div>
			<div>
				<p class="mb-12">Hormat kami</p>
				<p class="border-t border-slate-400 pt-1">
					{faktur.approver?.name ?? '(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)'}
				</p>
			</div>
		</footer>
	{/if}
</article>

<style>
	.faktur-half {
		max-width: 210mm;
		min-height: 120mm;
	}
	.faktur-full {
		max-width: 210mm;
		min-height: 260mm;
	}
	.faktur-halaman {
		max-width: 210mm;
		min-height: 260mm;
		page-break-after: always;
	}
	.faktur-halaman:last-child {
		page-break-after: auto;
	}
	.faktur-tabel tr {
		break-inside: avoid;
	}
	@media print {
		.faktur-dokumen {
			margin: 0;
			box-shadow: none;
		}
	}
</style>
