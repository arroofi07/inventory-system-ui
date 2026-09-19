import { apiFetch } from '$lib/api/http';

export type StatusStok = 'NORMAL' | 'RENDAH' | 'HABIS';

export type Barang = {
	id: number;
	kode_barang: string;
	nama_item: string;
	brand: string;
	satuan: string;
	/** Saldo resmi dari ledger (kolom `barang.stok_tersedia`). */
	stok_tersedia: number;
	min_stock: number;
	reorder_point: number;
	status_stok: StatusStok;
	metode_alokasi: 'FEFO' | 'FIFO' | string;
	expiry_alert_days: number;
	jumlah_batch_tersedia?: number;
	is_active: boolean;
};

export type PageMeta = {
	page: number;
	per_page: number;
	total: number;
	total_pages: number;
};

export type BarangListParams = {
	q?: string;
	page?: number;
	per_page?: number;
	sort?: string;
	brand?: string;
	status_stok?: StatusStok | '';
	is_active?: boolean;
	include_inactive?: boolean;
	with_stock?: boolean;
	popular?: boolean;
};

export type BarangCreateBody = {
	kode_barang: string;
	nama_item: string;
	brand: string;
	satuan?: string;
	min_stock?: number;
	reorder_point?: number;
	metode_alokasi?: 'FEFO' | 'FIFO';
	expiry_alert_days?: number;
};

export type BarangUpdateBody = {
	nama_item?: string;
	brand?: string;
	satuan?: string;
	min_stock?: number;
	reorder_point?: number;
	metode_alokasi?: 'FEFO' | 'FIFO';
	expiry_alert_days?: number;
};

function buildQuery(params: BarangListParams): string {
	const qs = new URLSearchParams();
	if (params.q) qs.set('q', params.q);
	if (params.page) qs.set('page', String(params.page));
	if (params.per_page) qs.set('per_page', String(params.per_page));
	if (params.sort) qs.set('sort', params.sort);
	if (params.brand) qs.set('brand', params.brand);
	if (params.status_stok) qs.set('status_stok', params.status_stok);
	if (params.is_active !== undefined) qs.set('is_active', String(params.is_active));
	if (params.include_inactive) qs.set('include_inactive', 'true');
	if (params.with_stock) qs.set('with_stock', 'true');
	if (params.popular) qs.set('popular', 'true');
	const s = qs.toString();
	return s ? `?${s}` : '';
}

export async function daftarBarang(params: BarangListParams = {}) {
	return apiFetch<{ data: Barang[]; meta: PageMeta }>(`/barang${buildQuery(params)}`);
}

export async function detailBarang(id: number) {
	return apiFetch<{ data: Barang }>(`/barang/${id}`);
}

export async function buatBarang(body: BarangCreateBody) {
	return apiFetch<{ data: Barang }>('/barang', {
		method: 'POST',
		body: JSON.stringify(body)
	});
}

export async function ubahBarang(id: number, body: BarangUpdateBody) {
	return apiFetch<{ data: Barang }>(`/barang/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(body)
	});
}

export async function setStatusBarang(id: number, is_active: boolean) {
	return apiFetch<{ data: Barang }>(`/barang/${id}/status`, {
		method: 'PATCH',
		body: JSON.stringify({ is_active })
	});
}

/** Deep-link form barang masuk untuk SKU ini (penerimaan baru — bukan mutate qty batch). */
export function pathTambahStok(kodeBarang: string): string {
	return `/barang-masuk/baru?kode_barang=${encodeURIComponent(kodeBarang)}`;
}

export type BatchTersediaItem = {
	barang_masuk_id: number;
	no_batch: string;
	no_faktur: string;
	exp: string;
	tanggal_masuk: string;
	sisa_hari: number;
	qty_masuk: number;
	qty_tersedia: number;
	harga_jual: string;
	hpp_dengan_ppn: string;
	mendekati_exp: boolean;
};

export type BatchTersediaResponse = {
	kode_barang: string;
	nama_item: string;
	satuan: string;
	metode_alokasi: string;
	stok_tersedia: number;
	batch: BatchTersediaItem[];
	rencana_alokasi?: { barang_masuk_id: number; no_batch: string; exp: string; qty: number }[];
};

export type BatchListItem = {
	barang_masuk_id: number;
	no_batch: string;
	no_faktur: string;
	exp: string;
	tanggal_masuk: string;
	qty_masuk: number;
	qty_tersedia: number;
	harga: string;
	harga_mt: string;
	harga_gt: string;
	hpp: string;
	hpp_dengan_ppn: string;
};

/** Batch bersaldo urut FEFO/FIFO — siap form sales. */
export async function batchTersedia(
	kodeBarang: string,
	params: { channel?: string; qty?: number } = {}
) {
	const qs = new URLSearchParams();
	if (params.channel) qs.set('channel', params.channel);
	if (params.qty) qs.set('qty', String(params.qty));
	const s = qs.toString();
	return apiFetch<{ data: BatchTersediaResponse }>(
		`/barang/${encodeURIComponent(kodeBarang)}/batch-tersedia${s ? `?${s}` : ''}`
	);
}

/** Semua batch SKU; limit=1 → batch terbaru. */
export async function daftarBatch(kodeBarang: string, limit?: number) {
	const qs = limit ? `?limit=${limit}` : '';
	return apiFetch<{ data: BatchListItem[] }>(
		`/barang/${encodeURIComponent(kodeBarang)}/batch${qs}`
	);
}

