import { apiFetch } from '$lib/api/http';

export type DashboardKartu = {
	transaksi_pending?: number;
	penjualan_bulan_ini?: string;
	total_piutang?: string;
	piutang_overdue?: string;
	sku_stok_rendah?: number;
	sku_stok_habis?: number;
	batch_mendekati_exp?: number;
	jumlah_transaksi_bulan_ini?: number;
};

export type DashboardAktivitasItem = {
	id: number;
	judul: string;
	subjudul?: string;
	nominal?: string | null;
	created_at: string;
};

export type Dashboard = {
	role: string;
	kartu: DashboardKartu;
	aktivitas_terkini: {
		transaksi_pending: DashboardAktivitasItem[];
		barang_masuk: DashboardAktivitasItem[];
		pembayaran: DashboardAktivitasItem[];
	};
	notifikasi_piutang?: {
		overdue: number;
		mendekati_jatuh_tempo: number;
	} | null;
};

export function ambilDashboard() {
	return apiFetch<{ data: Dashboard }>('/dashboard');
}
