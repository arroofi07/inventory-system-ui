import { apiFetch } from '$lib/api/http';
import type { PageMeta } from '$lib/api/barang';

export type ChannelOutlet =
	| 'Modern Trade'
	| 'Modern Trade Independent'
	| 'General Trade'
	| 'General Trade Kosmetik'
	| 'Sub Agen';

export const CHANNEL_OUTLET_OPTIONS: { value: ChannelOutlet; label: string }[] = [
	{ value: 'Modern Trade', label: 'Modern Trade' },
	{ value: 'Modern Trade Independent', label: 'Modern Trade Independent' },
	{ value: 'General Trade', label: 'General Trade' },
	{ value: 'General Trade Kosmetik', label: 'General Trade Kosmetik' },
	{ value: 'Sub Agen', label: 'Sub Agen' }
];

export const JENIS_BANGUNAN_OPTIONS = [
	{ value: 'Toko', label: 'Toko' },
	{ value: 'Ruko', label: 'Ruko' },
	{ value: 'Rumah Toko', label: 'Rumah Toko' },
	{ value: 'Kios', label: 'Kios' },
	{ value: 'Minimarket', label: 'Minimarket' },
	{ value: 'Warung', label: 'Warung' },
	{ value: 'Gudang', label: 'Gudang' },
	{ value: 'Pasar', label: 'Pasar' }
] as const;

export const STATUS_BANGUNAN_OPTIONS = [
	{ value: 'Milik Sendiri', label: 'Milik Sendiri' },
	{ value: 'Sewa', label: 'Sewa' },
	{ value: 'Kontrak', label: 'Kontrak' },
	{ value: 'Pinjam Pakai', label: 'Pinjam Pakai' }
] as const;

/** Sisipkan nilai lama (migrasi) bila belum ada di daftar opsi. */
export function opsiDenganNilaiLama(
	options: readonly { value: string; label: string }[],
	current: string
): { value: string; label: string }[] {
	const v = current.trim();
	if (v && !options.some((o) => o.value === v)) {
		return [{ value: v, label: v }, ...options];
	}
	return [...options];
}

export type Pelanggan = {
	id: number;
	kode_pelanggan: string;
	nama_pelanggan: string;
	tgl_registrasi: string;
	phone: string;
	npwp_nik?: string | null;
	nama_pemilik_npwp_nik?: string | null;
	alamat_npwp_nik?: string | null;
	territory: string;
	distrik: string;
	alamat_toko: string;
	rt_rw?: string | null;
	provinsi: string;
	kabupaten: string;
	kecamatan: string;
	kelurahan: string;
	kode_pos?: string | null;
	channel_outlet: ChannelOutlet | string;
	alamat_pengantaran_barang?: string | null;
	jenis_bangunan?: string | null;
	status_bangunan?: string | null;
	nominal_pengambilan_pertama: string;
	estimasi_batas_kredit: string;
	is_active: boolean;
	punya_transaksi?: boolean;
};

export type PelangganListParams = {
	q?: string;
	page?: number;
	per_page?: number;
	sort?: string;
	channel_outlet?: string;
	territory?: string;
	distrik?: string;
	include_inactive?: boolean;
};

export type PelangganCreateBody = {
	kode_pelanggan?: string;
	nama_pelanggan: string;
	tgl_registrasi: string;
	phone: string;
	npwp_nik?: string | null;
	nama_pemilik_npwp_nik?: string | null;
	alamat_npwp_nik?: string | null;
	territory: string;
	distrik: string;
	alamat_toko: string;
	rt_rw?: string | null;
	provinsi: string;
	kabupaten: string;
	kecamatan: string;
	kelurahan: string;
	kode_pos?: string | null;
	channel_outlet: ChannelOutlet | string;
	alamat_pengantaran_barang?: string | null;
	jenis_bangunan?: string | null;
	status_bangunan?: string | null;
	nominal_pengambilan_pertama?: string;
	estimasi_batas_kredit?: string;
};

export type PelangganUpdateBody = Partial<PelangganCreateBody>;

export type Select2Response = {
	results: { id: string; text: string }[];
	pagination: { more: boolean };
};

function buildQuery(params: PelangganListParams): string {
	const qs = new URLSearchParams();
	if (params.q) qs.set('q', params.q);
	if (params.page) qs.set('page', String(params.page));
	if (params.per_page) qs.set('per_page', String(params.per_page));
	if (params.sort) qs.set('sort', params.sort);
	if (params.channel_outlet) qs.set('channel_outlet', params.channel_outlet);
	if (params.territory) qs.set('territory', params.territory);
	if (params.distrik) qs.set('distrik', params.distrik);
	if (params.include_inactive) qs.set('include_inactive', 'true');
	const s = qs.toString();
	return s ? `?${s}` : '';
}

export async function daftarPelanggan(params: PelangganListParams = {}) {
	return apiFetch<{ data: Pelanggan[]; meta: PageMeta }>(`/pelanggan${buildQuery(params)}`);
}

export async function detailPelanggan(idOrKode: number | string) {
	return apiFetch<{ data: Pelanggan }>(`/pelanggan/${idOrKode}`);
}

export async function buatPelanggan(body: PelangganCreateBody) {
	return apiFetch<{ data: Pelanggan }>('/pelanggan', {
		method: 'POST',
		body: JSON.stringify(body)
	});
}

export async function ubahPelanggan(id: number, body: PelangganUpdateBody) {
	return apiFetch<{ data: Pelanggan }>(`/pelanggan/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(body)
	});
}

export async function setStatusPelanggan(id: number, is_active: boolean) {
	return apiFetch<{ data: Pelanggan }>(`/pelanggan/${id}/status`, {
		method: 'PATCH',
		body: JSON.stringify({ is_active })
	});
}

/** Format Select2: results + pagination.more (hanya aktif). */
export async function cariPelangganSelect2(q: string, page = 1) {
	const qs = new URLSearchParams();
	if (q) qs.set('q', q);
	qs.set('page', String(page));
	qs.set('per_page', '20');
	return apiFetch<Select2Response>(`/pelanggan/cari?${qs}`);
}

export type RiwayatTransaksiItem = {
	id: number;
	tanggal: string;
	total_akhir: string;
	status_approval: string;
	no_transaksi: string | null;
};

export async function riwayatTransaksiPelanggan(kodeAtauId: string | number) {
	return apiFetch<{ data: RiwayatTransaksiItem[] }>(
		`/pelanggan/${encodeURIComponent(String(kodeAtauId))}/riwayat-transaksi`
	);
}
