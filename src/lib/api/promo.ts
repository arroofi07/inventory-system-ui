import { apiFetch } from '$lib/api/http';
import type { PageMeta } from '$lib/api/barang';

export type TipePromo =
	| 'buy_x_get_y'
	| 'bonus_qty'
	| 'percentage_discount'
	| 'fixed_discount';

export const TIPE_PROMO_OPTIONS: { value: TipePromo; label: string }[] = [
	{ value: 'buy_x_get_y', label: 'Beli X gratis Y' },
	{ value: 'bonus_qty', label: 'Bonus qty' },
	{ value: 'percentage_discount', label: 'Diskon persen' },
	{ value: 'fixed_discount', label: 'Diskon nominal' }
];

export type Promo = {
	id: number;
	kode_promo: string;
	nama_promo: string;
	deskripsi?: string | null;
	tipe_promo: TipePromo | string;
	buy_qty?: number | null;
	get_qty?: number | null;
	bonus_qty: number;
	discount_percentage: string;
	discount_amount: string;
	min_qty: number;
	min_amount: string;
	max_applications?: number | null;
	kode_barang?: string | null;
	tanggal_mulai: string;
	tanggal_berakhir: string;
	is_active: boolean;
	syarat_ketentuan?: string | null;
};

export type PromoListParams = {
	q?: string;
	page?: number;
	per_page?: number;
	sort?: string;
	tipe_promo?: string;
	kode_barang?: string;
	aktif?: boolean;
	include_inactive?: boolean;
};

export type PromoCreateBody = {
	kode_promo?: string | null;
	nama_promo: string;
	deskripsi?: string | null;
	tipe_promo: TipePromo;
	buy_qty?: number | null;
	get_qty?: number | null;
	bonus_qty?: number | null;
	discount_percentage?: string | null;
	discount_amount?: string | null;
	min_qty?: number;
	min_amount?: string;
	max_applications?: number | null;
	kode_barang?: string | null;
	tanggal_mulai: string;
	tanggal_berakhir: string;
	syarat_ketentuan?: string | null;
	is_active?: boolean;
};

export type PromoUpdateBody = Partial<Omit<PromoCreateBody, 'kode_promo'>>;

function buildQuery(params: PromoListParams): string {
	const qs = new URLSearchParams();
	if (params.q) qs.set('q', params.q);
	if (params.page) qs.set('page', String(params.page));
	if (params.per_page) qs.set('per_page', String(params.per_page));
	if (params.sort) qs.set('sort', params.sort);
	if (params.tipe_promo) qs.set('tipe_promo', params.tipe_promo);
	if (params.kode_barang) qs.set('kode_barang', params.kode_barang);
	if (params.aktif) qs.set('aktif', 'true');
	if (params.include_inactive) qs.set('include_inactive', 'true');
	const s = qs.toString();
	return s ? `?${s}` : '';
}

export async function daftarPromo(params: PromoListParams = {}) {
	return apiFetch<{ data: Promo[]; meta: PageMeta }>(`/promo${buildQuery(params)}`);
}

export async function detailPromo(id: number) {
	return apiFetch<{ data: Promo }>(`/promo/${id}`);
}

export async function buatPromo(body: PromoCreateBody) {
	return apiFetch<{ data: Promo }>('/promo', {
		method: 'POST',
		body: JSON.stringify(body)
	});
}

export async function ubahPromo(id: number, body: PromoUpdateBody) {
	return apiFetch<{ data: Promo }>(`/promo/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(body)
	});
}

export async function setStatusPromo(id: number, is_active: boolean) {
	return apiFetch<{ data: Promo }>(`/promo/${id}/status`, {
		method: 'PATCH',
		body: JSON.stringify({ is_active })
	});
}

export async function hapusPromo(id: number) {
	return apiFetch<void>(`/promo/${id}`, { method: 'DELETE' });
}
