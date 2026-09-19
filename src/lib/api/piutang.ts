import { apiFetch, apiDownload } from '$lib/api/http';
import type { PageMeta } from '$lib/api/barang';

export type PiutangItem = {
	transaksi_id: number;
	no_transaksi: string | null;
	tanggal: string;
	kode_pelanggan: string;
	nama_pelanggan: string;
	total_akhir: string;
	jumlah_dibayar: string;
	sisa_hutang: string;
	status_pembayaran: string;
	tanggal_jatuh_tempo?: string | null;
	kategori_jatuh_tempo: string;
	hari_terlambat: number;
	tanggal_pembayaran_terakhir?: string | null;
};

export type PiutangRingkasan = {
	total_nilai: string;
	total_dibayar: string;
	total_piutang: string;
	piutang_overdue: string;
	jumlah_transaksi: number;
	jumlah_transaksi_overdue: number;
};

export type PiutangListParams = {
	q?: string;
	status_pembayaran?: string;
	kategori_jatuh_tempo?: string;
	brand?: string;
	date_from?: string;
	date_to?: string;
	date_type?: string;
	page?: number;
	per_page?: number;
};

export type NotifikasiPiutang = {
	overdue: number;
	mendekati_jatuh_tempo: number;
};

export type HasilPembayaran = {
	transaksi_id: number;
	no_transaksi: string | null;
	total_akhir: string;
	jumlah_dibayar: string;
	sisa_hutang: string;
	status_pembayaran: string;
	tanggal_pembayaran_terakhir?: string | null;
	riwayat_id: number;
};

export type CatatPembayaranBody = {
	nominal_pembayaran: string;
	tanggal_pembayaran?: string;
	metode_pembayaran?: string;
	keterangan?: string;
};

export type RiwayatPembayaranItem = {
	id: number;
	nominal_pembayaran: string;
	old_jumlah_dibayar: string;
	new_jumlah_dibayar: string;
	old_sisa_hutang: string;
	new_sisa_hutang: string;
	old_status?: string | null;
	new_status?: string | null;
	metode_pembayaran?: string | null;
	tanggal_pembayaran?: string | null;
	keterangan?: string | null;
	changed_by?: number | null;
	changed_at: string;
};

function buildQuery(params: PiutangListParams): string {
	const qs = new URLSearchParams();
	if (params.q) qs.set('q', params.q);
	if (params.status_pembayaran) qs.set('status_pembayaran', params.status_pembayaran);
	if (params.kategori_jatuh_tempo) qs.set('kategori_jatuh_tempo', params.kategori_jatuh_tempo);
	if (params.brand) qs.set('brand', params.brand);
	if (params.date_from) qs.set('date_from', params.date_from);
	if (params.date_to) qs.set('date_to', params.date_to);
	if (params.date_type) qs.set('date_type', params.date_type);
	if (params.page) qs.set('page', String(params.page));
	if (params.per_page) qs.set('per_page', String(params.per_page));
	const s = qs.toString();
	return s ? `?${s}` : '';
}

export function daftarPiutang(params: PiutangListParams = {}) {
	return apiFetch<{ data: PiutangItem[]; meta: PageMeta; ringkasan: PiutangRingkasan }>(
		`/piutang${buildQuery(params)}`
	);
}

export function daftarPiutangOverdue(params: PiutangListParams = {}) {
	return apiFetch<{ data: PiutangItem[]; meta: PageMeta; ringkasan: PiutangRingkasan }>(
		`/piutang/overdue${buildQuery(params)}`
	);
}

export function piutangPelanggan(kode: string, params: PiutangListParams = {}) {
	return apiFetch<{ data: PiutangItem[]; meta: PageMeta; ringkasan: PiutangRingkasan }>(
		`/piutang/pelanggan/${encodeURIComponent(kode)}${buildQuery(params)}`
	);
}

export function riwayatPiutangPelanggan(kode: string) {
	return apiFetch<{ data: RiwayatPembayaranItem[] }>(
		`/piutang/pelanggan/${encodeURIComponent(kode)}/riwayat`
	);
}

export function notifikasiPiutang() {
	return apiFetch<{ data: NotifikasiPiutang }>('/notifikasi/piutang');
}

export function catatPembayaran(
	transaksiId: number,
	body: CatatPembayaranBody,
	idempotencyKey?: string
) {
	const headers: Record<string, string> = {};
	if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
	return apiFetch<{ data: HasilPembayaran }>(`/transaksi/${transaksiId}/pembayaran`, {
		method: 'POST',
		headers,
		body: JSON.stringify(body)
	});
}

export async function unduhEksporPiutang(params: PiutangListParams = {}) {
	await apiDownload(`/piutang/export${buildQuery(params)}`, 'piutang.csv');
}
