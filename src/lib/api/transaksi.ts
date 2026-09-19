import { apiFetch } from '$lib/api/http';
import type { PageMeta } from '$lib/api/barang';

export type CekStokItemRequest = {
	kode_item: string;
	qty: number;
	barang_masuk_id?: number;
};

export type CekStokBatch = {
	barang_masuk_id: number;
	no_batch: string;
	exp: string;
	qty_tersedia: number;
};

export type CekStokItem = {
	kode_item: string;
	nama_item: string;
	qty_diminta: number;
	stok_tersedia: number;
	stok_cukup: boolean;
	batch: CekStokBatch[];
};

export type CekStokResult = {
	items: CekStokItem[];
	semua_stok_cukup: boolean;
	catatan: string;
};

export type TransaksiItemPayload = {
	kode_item: string;
	qty: number;
	harga: string;
	disc1_persen?: string;
	disc2_persen?: string;
	disc3_persen?: string;
	kode_promos?: string[];
	barang_masuk_id?: number;
};

export type PratinjauPayload = {
	kode_pelanggan: string;
	tanggal: string;
	items: TransaksiItemPayload[];
	disc1_persen?: string;
	disc2_persen?: string;
	disc3_persen?: string;
	ppn_persen?: string;
};

export type BuatTransaksiPayload = PratinjauPayload & {
	area: string;
	nominal_dibayar?: string;
	tanggal_jatuh_tempo?: string | null;
	keterangan_pembayaran?: string;
};

export type PratinjauItem = {
	kode_item: string;
	nama_item: string;
	jumlah: number;
	qty_promo: number;
	total_qty_keluar: number;
	harga: string;
	subtotal: string;
	total_after_disc: string;
	diskon_promo?: string;
	stok_cukup: boolean;
	stok_tersedia: number;
};

export type PratinjauRingkasan = {
	jumlah_item: number;
	total_qty_ditagih: number;
	total_qty_keluar: number;
	grand_total: string;
	total: string;
	ppn_nominal: string;
	total_akhir: string;
};

export type PratinjauResult = {
	items: PratinjauItem[];
	ringkasan: PratinjauRingkasan;
	semua_stok_cukup: boolean;
	peringatan: string[];
};

export type Transaksi = {
	id: number;
	no_transaksi: string | null;
	tanggal: string;
	periode?: string;
	kode_pelanggan: string;
	nama_pelanggan: string;
	alamat?: string;
	channel_outlet: string;
	area: string;
	is_multi_item: boolean;
	disc1_persen?: string;
	disc2_persen?: string;
	disc3_persen?: string;
	ppn_persen?: string;
	total: string;
	ppn_nominal: string;
	total_akhir: string;
	jumlah_item: number;
	total_qty_ditagih?: number;
	total_qty_keluar?: number;
	status_approval: string;
	status_pembayaran: string;
	jumlah_dibayar?: string;
	sisa_hutang?: string;
	tanggal_jatuh_tempo?: string | null;
	keterangan_pembayaran?: string | null;
	sales?: { id: number; name?: string } | null;
	items?: TransaksiDetailItem[];
	created_at?: string;
	updated_at?: string;
};

export type TransaksiDetailItem = {
	id?: number;
	urutan?: number;
	kode_item: string;
	nama_item: string;
	satuan?: string;
	jumlah: number;
	qty_promo?: number;
	total_qty_keluar: number;
	harga: string;
	subtotal?: string;
	disc1_persen?: string;
	total_after_disc?: string;
	hpp_snapshot?: string;
	promo_diterapkan?: { kode_promo: string; nama_promo?: string; qty_bonus?: number }[];
	batch_number?: string | null;
	expiry_date?: string | null;
};

export type TransaksiListItem = {
	id: number;
	no_transaksi: string | null;
	tanggal: string;
	kode_pelanggan: string;
	nama_pelanggan: string;
	channel_outlet: string;
	area: string;
	is_multi_item: boolean;
	jumlah_item: number;
	total_qty_ditagih: number;
	total_qty_keluar: number;
	total: string;
	ppn_nominal: string;
	total_akhir: string;
	status_approval: string;
	status_pembayaran: string;
	sales_id?: number | null;
	created_at?: string;
	/** Opsional — bila API menyertakan indikator kecukupan stok di daftar. */
	stok_cukup?: boolean;
};

export type TransaksiListParams = {
	q?: string;
	page?: number;
	per_page?: number;
	sort?: string;
	status_approval?: string;
	status_pembayaran?: string;
	date_from?: string;
	date_to?: string;
	sales_id?: number;
	/** Filter antrian: `cukup` | `kurang`. */
	kecukupan_stok?: string;
};

export type KetersediaanSKUBaris = {
	kode_item: string;
	nama_item: string;
	diminta: number;
	tersedia: number;
	stok_cukup: boolean;
	bersaing_ids: number[];
};

export type TransaksiBersaingItem = {
	id: number;
	kode_pelanggan: string;
	nama_pelanggan: string;
	total_akhir: string;
	tanggal: string;
	kode_items: string[];
};

export type KetersediaanStok = {
	transaksi_id: number;
	semua_stok_cukup: boolean;
	sku: KetersediaanSKUBaris[];
	bersaing: TransaksiBersaingItem[];
};

export type HasilApproval = {
	id: number;
	no_transaksi: string;
	status_approval: string;
	approved_at?: string;
	approved_by?: number;
	total_akhir?: string;
	pergerakan_stok?: {
		kode_item: string;
		no_batch: string;
		qty: number;
		saldo_setelah: number;
	}[];
};

export type StokKurangDetail = {
	kode_item: string;
	nama_item: string;
	diminta: number;
	tersedia: number;
};

export type BulkApproveItemHasil = {
	id: number;
	ok: boolean;
	no_transaksi?: string | null;
	code?: string;
	message?: string;
	details?: StokKurangDetail[];
};

export type BulkApproveResult = {
	berhasil: BulkApproveItemHasil[];
	gagal: BulkApproveItemHasil[];
	ringkasan: {
		total: number;
		berhasil: number;
		gagal: number;
	};
};

function buildQuery(params: TransaksiListParams): string {
	const qs = new URLSearchParams();
	if (params.q) qs.set('q', params.q);
	if (params.page) qs.set('page', String(params.page));
	if (params.per_page) qs.set('per_page', String(params.per_page));
	if (params.sort) qs.set('sort', params.sort);
	if (params.status_approval) qs.set('status_approval', params.status_approval);
	if (params.status_pembayaran) qs.set('status_pembayaran', params.status_pembayaran);
	if (params.date_from) qs.set('date_from', params.date_from);
	if (params.date_to) qs.set('date_to', params.date_to);
	if (params.sales_id) qs.set('sales_id', String(params.sales_id));
	if (params.kecukupan_stok) qs.set('kecukupan_stok', params.kecukupan_stok);
	const s = qs.toString();
	return s ? `?${s}` : '';
}

export function daftarTransaksi(params: TransaksiListParams = {}) {
	return apiFetch<{ data: TransaksiListItem[]; meta: PageMeta }>(
		`/transaksi${buildQuery(params)}`
	);
}

export function detailTransaksi(id: number) {
	return apiFetch<{ data: Transaksi }>(`/transaksi/${id}`);
}

export function tambahItemsTransaksi(id: number, body: { item?: TransaksiItemPayload; items?: TransaksiItemPayload[] }) {
	return apiFetch<{ data: Transaksi }>(`/transaksi/${id}/items`, {
		method: 'POST',
		body: JSON.stringify(body)
	});
}

/** Soft-check ketersediaan stok (SC-05). Bukan jaminan alokasi. */
export function cekStok(items: CekStokItemRequest[]) {
	return apiFetch<{ data: CekStokResult }>('/transaksi/cek-stok', {
		method: 'POST',
		body: JSON.stringify({ items })
	});
}

/** Pratinjau server (SC-02) — sumber angka tampilan resmi. */
export function pratinjauTransaksi(body: PratinjauPayload) {
	return apiFetch<{ data: PratinjauResult }>('/transaksi/pratinjau', {
		method: 'POST',
		body: JSON.stringify(body)
	});
}

/** Simpan transaksi pending (SC-03). */
export function buatTransaksi(body: BuatTransaksiPayload) {
	return apiFetch<{ data: Transaksi }>('/transaksi', {
		method: 'POST',
		body: JSON.stringify(body)
	});
}

/** Tabel kecukupan stok + pending bersaing (SC-09). */
export function ketersediaanStok(id: number) {
	return apiFetch<{ data: KetersediaanStok }>(`/transaksi/${id}/ketersediaan-stok`);
}

/** Setujui transaksi pending (SC-10). */
export function approveTransaksi(id: number, body: { approval_notes?: string } = {}) {
	return apiFetch<{ data: HasilApproval }>(`/transaksi/${id}/approve`, {
		method: 'POST',
		body: JSON.stringify(body)
	});
}

/** Tolak transaksi pending — catatan wajib (SC-11). */
export function rejectTransaksi(id: number, body: { approval_notes: string }) {
	return apiFetch<{ data: Transaksi }>(`/transaksi/${id}/reject`, {
		method: 'POST',
		body: JSON.stringify(body)
	});
}

/** Setujui banyak transaksi (SC-12). */
export function bulkApproveTransaksi(body: {
	transaksi_ids: number[];
	approval_notes?: string;
}) {
	return apiFetch<{ data: BulkApproveResult }>('/transaksi/approvals/bulk', {
		method: 'POST',
		body: JSON.stringify(body)
	});
}
