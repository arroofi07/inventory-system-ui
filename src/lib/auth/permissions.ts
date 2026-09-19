export type Permission =
	| 'user.lihat'
	| 'user.kelola'
	| 'barang.lihat'
	| 'barang.kelola'
	| 'barang.hapus'
	| 'barang_masuk.lihat'
	| 'barang_masuk.buat'
	| 'barang_masuk.ubah'
	| 'barang_masuk.hapus'
	| 'harga.kelola'
	| 'pelanggan.lihat'
	| 'pelanggan.buat'
	| 'pelanggan.ubah'
	| 'transaksi.lihat_semua'
	| 'transaksi.lihat_milik'
	| 'transaksi.buat'
	| 'transaksi.ubah'
	| 'approval.lakukan'
	| 'approval.batalkan'
	| 'faktur.cetak'
	| 'faktur.cetak_ulang'
	| 'pembayaran.lihat'
	| 'pembayaran.catat'
	| 'promo.lihat'
	| 'promo.kelola'
	| 'promo.hapus'
	| 'stok.lihat'
	| 'stok.sesuaikan'
	| 'laporan.stok'
	| 'laporan.penjualan'
	| 'laporan.laba'
	| 'laporan.analytics'
	| 'laporan.ekspor'
	| 'audit.lihat';

export type AuthRole = 'super_admin' | 'admin' | 'afiliasi' | 'sales';

const semua: Permission[] = [
	'user.lihat',
	'user.kelola',
	'barang.lihat',
	'barang.kelola',
	'barang.hapus',
	'barang_masuk.lihat',
	'barang_masuk.buat',
	'barang_masuk.ubah',
	'barang_masuk.hapus',
	'harga.kelola',
	'pelanggan.lihat',
	'pelanggan.buat',
	'pelanggan.ubah',
	'transaksi.lihat_semua',
	'transaksi.lihat_milik',
	'transaksi.buat',
	'transaksi.ubah',
	'approval.lakukan',
	'approval.batalkan',
	'faktur.cetak',
	'faktur.cetak_ulang',
	'pembayaran.lihat',
	'pembayaran.catat',
	'promo.lihat',
	'promo.kelola',
	'promo.hapus',
	'stok.lihat',
	'stok.sesuaikan',
	'laporan.stok',
	'laporan.penjualan',
	'laporan.laba',
	'laporan.analytics',
	'laporan.ekspor',
	'audit.lihat'
];

function himpunan(...ps: Permission[]): Set<Permission> {
	return new Set(ps);
}

/** Mirror izinPerRole di go-boilerplate/internal/domain/permission.go */
export const izinPerRole: Record<AuthRole, Set<Permission>> = {
	super_admin: himpunan(...semua),
	admin: himpunan(
		'user.lihat',
		'barang.lihat',
		'barang.kelola',
		'barang_masuk.lihat',
		'barang_masuk.buat',
		'pelanggan.lihat',
		'pelanggan.buat',
		'transaksi.lihat_semua',
		'transaksi.ubah',
		'approval.lakukan',
		'faktur.cetak',
		'pembayaran.lihat',
		'pembayaran.catat',
		'promo.lihat',
		'promo.kelola',
		'stok.lihat',
		'laporan.stok',
		'laporan.penjualan',
		'laporan.laba',
		'laporan.analytics',
		'laporan.ekspor'
	),
	afiliasi: himpunan(
		'barang.lihat',
		'barang_masuk.lihat',
		'transaksi.lihat_semua',
		'faktur.cetak',
		'pembayaran.lihat',
		'promo.lihat',
		'stok.lihat',
		'laporan.stok',
		'laporan.penjualan',
		'laporan.ekspor'
	),
	sales: himpunan(
		'barang.lihat',
		'pelanggan.lihat',
		'promo.lihat',
		'transaksi.lihat_milik',
		'transaksi.buat'
	)
};

export function punyaIzin(role: AuthRole, p: Permission): boolean {
	return izinPerRole[role]?.has(p) ?? false;
}

export function punyaSalahSatu(role: AuthRole, ps: Permission[]): boolean {
	return ps.some((p) => punyaIzin(role, p));
}
