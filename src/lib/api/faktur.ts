import { apiFetch, apiDownload } from '$lib/api/http';

export type FakturItem = {
	urutan: number;
	kode_item: string;
	nama_item: string;
	no_batch?: string | null;
	exp?: string | null;
	qty: number;
	satuan: string;
	harga: string;
	disc1_persen?: string;
	disc2_persen?: string;
	disc3_persen?: string;
	nilai_setelah_global?: string;
	ppn_baris?: string;
	total_final_baris: string;
	is_bonus: boolean;
};

export type Faktur = {
	no_transaksi: string | null;
	tanggal: string;
	layout: 'half' | 'full' | 'paginated' | string;
	total_halaman: number;
	perusahaan: {
		nama: string;
		alamat: string;
		telepon: string;
		npwp: string;
	};
	pelanggan: {
		kode_pelanggan: string;
		nama_pelanggan: string;
		alamat: string;
		channel_outlet: string;
	};
	items: FakturItem[];
	ringkasan: {
		total: string;
		disc1_persen: string;
		disc2_persen?: string;
		disc3_persen?: string;
		ppn_persen: string;
		ppn_nominal: string;
		total_akhir: string;
		terbilang: string;
	};
	sales?: { id: number; name: string } | null;
	approver?: { id: number; name: string } | null;
	faktur_dicetak_at?: string | null;
	cetak_ulang: boolean;
};

export function ambilFaktur(transaksiId: number) {
	return apiFetch<{ data: Faktur }>(`/transaksi/${transaksiId}/faktur`);
}

export async function unduhFakturPdf(transaksiId: number, noTransaksi?: string | null) {
	const fallback = noTransaksi ? `faktur-${noTransaksi}.pdf` : `faktur-${transaksiId}.pdf`;
	await apiDownload(`/transaksi/${transaksiId}/faktur/pdf`, fallback);
}
