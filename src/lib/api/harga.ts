import { apiFetch } from '$lib/api/http';
import type { PageMeta } from '$lib/api/barang';

export type HargaMassalBody = {
	batch_ids: number[];
	harga?: string;
	disc_hpp_1?: string;
	disc_hpp_2?: string;
	disc_hpp_3?: string;
	markup_mt_type?: 'percent' | 'value';
	markup_mt_amount?: string;
	markup_gt_type?: 'percent' | 'value';
	markup_gt_amount?: string;
	keterangan?: string;
};

export type HargaMassalResult = {
	bulk_operation_id: string;
	jumlah_batch_diperbarui: number;
	jumlah_dilewati: number;
};

export type PriceChangeLog = {
	id: number;
	barang_masuk_id: number;
	no_batch: string;
	bulk_operation_id: string;
	old_harga?: string;
	new_harga?: string;
	old_hpp?: string;
	new_hpp?: string;
	old_harga_mt?: string;
	new_harga_mt?: string;
	old_harga_gt?: string;
	new_harga_gt?: string;
	keterangan?: string | null;
	changed_at: string;
};

export async function hargaMassal(barangId: number, body: HargaMassalBody) {
	return apiFetch<{ data: HargaMassalResult }>(`/barang/${barangId}/harga-massal`, {
		method: 'POST',
		body: JSON.stringify(body)
	});
}

export async function riwayatHarga(barangId: number, params: { page?: number; per_page?: number } = {}) {
	const qs = new URLSearchParams();
	if (params.page) qs.set('page', String(params.page));
	if (params.per_page) qs.set('per_page', String(params.per_page));
	const s = qs.toString();
	return apiFetch<{ data: PriceChangeLog[]; meta: PageMeta }>(
		`/barang/${barangId}/riwayat-harga${s ? `?${s}` : ''}`
	);
}
