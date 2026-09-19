import { apiFetch, apiDownload } from '$lib/api/http';
import type { PageMeta } from '$lib/api/barang';

export type BarisLaporanStok = {
	kode_barang: string;
	nama_item: string;
	brand: string;
	satuan: string;
	total_masuk: number;
	total_keluar: number;
	stok_tersedia: number;
	min_stock: number;
	status_stok: string;
	jumlah_batch: number;
	batch_terdekat_exp?: string | null;
	nilai_stok_hpp: string;
};

export type LaporanStokRingkasan = {
	normal: number;
	rendah: number;
	habis: number;
};

export type LaporanStokParams = {
	q?: string;
	brand?: string;
	status_stok?: string;
	page?: number;
	per_page?: number;
};

export type BarisBarangKeluar = {
	transaksi_id: number;
	no_transaksi: string | null;
	tanggal: string;
	kode_pelanggan: string;
	nama_pelanggan: string;
	alamat?: string | null;
	channel_outlet: string;
	area: string;
	nama_sales?: string | null;
	kode_item: string;
	nama_item: string;
	brand: string;
	no_batch?: string | null;
	exp?: string | null;
	qty: number;
	qty_promo: number;
	total_qty_keluar: number;
	harga: string;
	disc1_persen: string;
	disc2_persen: string;
	disc3_persen: string;
	total_after_disc: string;
	ppn_baris: string;
	total_final_baris: string;
	hpp_snapshot?: string | null;
	hpp_total?: string | null;
	provit?: string | null;
	margin_persen?: string | null;
};

export type LaporanBarangKeluarRingkasan = {
	total_qty_keluar: number;
	total_final: string;
	total_hpp?: string;
	total_provit?: string;
};

export type LaporanBarangKeluarParams = {
	q?: string;
	date_from?: string;
	date_to?: string;
	kode_pelanggan?: string;
	kode_item?: string;
	brand?: string;
	sales_id?: number;
	page?: number;
	per_page?: number;
};

function buildQuery(params: Record<string, string | number | undefined>): string {
	const qs = new URLSearchParams();
	for (const [k, v] of Object.entries(params)) {
		if (v === undefined || v === '') continue;
		qs.set(k, String(v));
	}
	const s = qs.toString();
	return s ? `?${s}` : '';
}

export function daftarLaporanStok(params: LaporanStokParams = {}) {
	return apiFetch<{ data: BarisLaporanStok[]; meta: PageMeta; ringkasan: LaporanStokRingkasan }>(
		`/laporan/stok${buildQuery(params)}`
	);
}

export async function unduhEksporStok(params: LaporanStokParams = {}) {
	await apiDownload(`/laporan/stok/export${buildQuery(params)}`, 'laporan-stok.csv');
}

export function daftarBarangKeluar(params: LaporanBarangKeluarParams = {}) {
	return apiFetch<{
		data: BarisBarangKeluar[];
		meta: PageMeta;
		ringkasan: LaporanBarangKeluarRingkasan;
	}>(`/laporan/barang-keluar${buildQuery(params)}`);
}

export async function unduhEksporBarangKeluar(params: LaporanBarangKeluarParams = {}) {
	await apiDownload(`/laporan/barang-keluar/export${buildQuery(params)}`, 'laporan-barang-keluar.csv');
}

export type BarisChannelAnalytics = {
	channel_outlet: string;
	jumlah_transaksi: number;
	total_penjualan: string;
	total_qty: number;
	rata_nilai_order: string;
	jumlah_outlet: number;
};

export type BarisTerritoryAnalytics = {
	territory: string;
	jumlah_transaksi: number;
	total_penjualan: string;
	total_qty: number;
	jumlah_outlet: number;
};

export type BarisProdukTerlaris = {
	kode_item: string;
	nama_item: string;
	total_qty: number;
	total_qty_keluar: number;
	jumlah_transaksi: number;
	total_after_disc: string;
};

export type BarisTrenHarian = {
	tanggal: string;
	jumlah_transaksi: number;
	total_penjualan: string;
};

export type ChannelAnalyticsData = {
	per_channel: BarisChannelAnalytics[];
	per_territory: BarisTerritoryAnalytics[];
	produk_terlaris: BarisProdukTerlaris[];
	tren_harian: BarisTrenHarian[];
};

export type ChannelAnalyticsParams = {
	date_from?: string;
	date_to?: string;
	limit?: number;
};

export function ambilChannelAnalytics(params: ChannelAnalyticsParams = {}) {
	return apiFetch<{ data: ChannelAnalyticsData }>(
		`/laporan/channel-analytics${buildQuery(params)}`
	);
}

export async function unduhEksporChannelAnalytics(params: ChannelAnalyticsParams = {}) {
	await apiDownload(
		`/laporan/channel-analytics/export${buildQuery(params)}`,
		'channel-analytics.csv'
	);
}

export type LaporanPenjualanItem = {
	id: number;
	no_transaksi: string | null;
	tanggal: string;
	kode_pelanggan: string;
	nama_pelanggan: string;
	channel_outlet: string;
	area: string;
	jumlah_item: number;
	total_qty_ditagih: number;
	total_qty_keluar: number;
	total: string;
	ppn_nominal: string;
	total_akhir: string;
	status_approval: string;
	status_pembayaran: string;
	sales_id?: number | null;
};

export type LaporanPenjualanRingkasan = {
	jumlah_transaksi: number;
	total_penjualan: string;
};

export type LaporanPenjualanParams = {
	q?: string;
	date_from?: string;
	date_to?: string;
	channel_outlet?: string;
	sales_id?: number;
	status_pembayaran?: string;
	page?: number;
	per_page?: number;
};

export function daftarLaporanPenjualan(params: LaporanPenjualanParams = {}) {
	return apiFetch<{
		data: LaporanPenjualanItem[];
		meta: PageMeta;
		ringkasan: LaporanPenjualanRingkasan;
	}>(`/laporan/penjualan${buildQuery(params)}`);
}

export async function unduhEksporPenjualan(params: LaporanPenjualanParams = {}) {
	await apiDownload(`/laporan/penjualan/export${buildQuery(params)}`, 'laporan-penjualan.csv');
}
