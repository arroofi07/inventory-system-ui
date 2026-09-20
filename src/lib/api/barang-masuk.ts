import { apiFetch } from '$lib/api/http';
import type { PageMeta } from '$lib/api/barang';

export type BarangMasuk = {
	id: number;
	barang_id: number;
	kode_barang: string;
	nama_item: string;
	brand: string;
	no_faktur: string;
	no_batch: string;
	exp: string;
	tanggal_masuk: string;
	qty: number;
	qty_tersedia: number;
	harga: string;
	disc_hpp_1: string;
	disc_hpp_2: string;
	disc_hpp_3: string;
	hpp: string;
	hpp_dengan_ppn: string;
	markup_mt_type: string;
	markup_mt_amount: string;
	markup_gt_type: string;
	markup_gt_amount: string;
	harga_mt: string;
	harga_gt: string;
	aging_month: number;
	created_at?: string;
};

export type BarangMasukListParams = {
	q?: string;
	page?: number;
	per_page?: number;
	sort?: string;
	brand?: string;
	kode_barang?: string;
	date_from?: string;
	date_to?: string;
};

export type BarangMasukCreateBody = {
	kode_barang: string;
	buat_barang_baru?: boolean;
	nama_item?: string;
	brand?: string;
	satuan?: string;
	min_stock?: number;
	reorder_point?: number;
	metode_alokasi?: 'FEFO' | 'FIFO';
	expiry_alert_days?: number;
	no_faktur: string;
	no_batch: string;
	exp: string;
	tanggal_masuk: string;
	qty: number;
	harga: string;
	disc_hpp_1?: string;
	disc_hpp_2?: string;
	disc_hpp_3?: string;
	markup_mt_type?: 'percent' | 'value';
	markup_mt_amount?: string;
	markup_gt_type?: 'percent' | 'value';
	markup_gt_amount?: string;
	aging_month?: number;
};

function buildQuery(params: BarangMasukListParams): string {
	const qs = new URLSearchParams();
	if (params.q) qs.set('q', params.q);
	if (params.page) qs.set('page', String(params.page));
	if (params.per_page) qs.set('per_page', String(params.per_page));
	if (params.sort) qs.set('sort', params.sort);
	if (params.brand) qs.set('brand', params.brand);
	if (params.kode_barang) qs.set('kode_barang', params.kode_barang);
	if (params.date_from) qs.set('date_from', params.date_from);
	if (params.date_to) qs.set('date_to', params.date_to);
	const s = qs.toString();
	return s ? `?${s}` : '';
}

export async function daftarBarangMasuk(params: BarangMasukListParams = {}) {
	return apiFetch<{ data: BarangMasuk[]; meta: PageMeta }>(`/barang-masuk${buildQuery(params)}`);
}

export async function detailBarangMasuk(id: number) {
	return apiFetch<{ data: BarangMasuk }>(`/barang-masuk/${id}`);
}

export async function buatBarangMasuk(body: BarangMasukCreateBody) {
	return apiFetch<{ data: BarangMasuk }>('/barang-masuk', {
		method: 'POST',
		body: JSON.stringify(body)
	});
}

export type BarangMasukUpdateBody = {
	no_faktur?: string;
	no_batch?: string;
	exp?: string;
	tanggal_masuk?: string;
	qty?: number;
	harga?: string;
	disc_hpp_1?: string;
	disc_hpp_2?: string;
	disc_hpp_3?: string;
	markup_mt_type?: 'percent' | 'value';
	markup_mt_amount?: string;
	markup_gt_type?: 'percent' | 'value';
	markup_gt_amount?: string;
	aging_month?: number;
};

export async function ubahBarangMasuk(id: number, body: BarangMasukUpdateBody) {
	return apiFetch<{ data: BarangMasuk }>(`/barang-masuk/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(body)
	});
}

export async function hapusBarangMasuk(id: number) {
	return apiFetch<{ data: { ok: boolean } }>(`/barang-masuk/${id}`, { method: 'DELETE' });
}
