import type { AuthRole, Permission } from '$lib/auth/permissions';
import { punyaIzin, punyaSalahSatu } from '$lib/auth/permissions';

export type NavItem = {
	label: string;
	href: string;
	/** Satu izin, atau beberapa (OR). */
	permission: Permission | Permission[];
};

export type NavGroup = {
	label: string;
	items: NavItem[];
};

/** Navigasi tunggal; item difilter menurut izin role. */
export const navigasi: NavGroup[] = [
	{
		label: 'Utama',
		items: [
			{
				label: 'Dashboard',
				href: '/dashboard',
				permission: ['transaksi.lihat_milik', 'transaksi.lihat_semua']
			}
		]
	},
	{
		label: 'Penjualan',
		items: [
			{
				label: 'Transaksi',
				href: '/transaksi',
				permission: ['transaksi.lihat_milik', 'transaksi.lihat_semua']
			},
			{
				label: 'Persetujuan',
				href: '/approval',
				permission: ['approval.lakukan', 'transaksi.lihat_semua']
			},
			{ label: 'Piutang', href: '/piutang', permission: 'pembayaran.lihat' }
		]
	},
	{
		label: 'Inventory',
		items: [
			{ label: 'Data Barang', href: '/barang', permission: 'barang.lihat' },
			{ label: 'Barang Masuk', href: '/barang-masuk', permission: 'barang_masuk.lihat' },
			{ label: 'Barang Keluar', href: '/barang-keluar', permission: 'laporan.penjualan' },
			{ label: 'Laporan Stok', href: '/laporan-stok', permission: 'laporan.stok' }
		]
	},
	{
		label: 'Master Data',
		items: [
			{ label: 'Pelanggan', href: '/pelanggan', permission: 'pelanggan.lihat' },
			{ label: 'Promo', href: '/promo', permission: 'promo.lihat' },
			{ label: 'Pengguna', href: '/users', permission: 'user.lihat' }
		]
	},
	{
		label: 'Laporan',
		items: [
			{
				label: 'Channel Analytics',
				href: '/channel-analytics',
				permission: 'laporan.analytics'
			},
			{
				label: 'Laporan Penjualan',
				href: '/laporan-penjualan',
				permission: 'laporan.penjualan'
			}
		]
	}
];

function itemDiizinkan(role: AuthRole, item: NavItem): boolean {
	const p = item.permission;
	return Array.isArray(p) ? punyaSalahSatu(role, p) : punyaIzin(role, p);
}

/** Filter navigasi untuk role; grup kosong dihilangkan. */
export function filterNavigasi(role: AuthRole, sumber: NavGroup[] = navigasi): NavGroup[] {
	return sumber
		.map((g) => ({
			...g,
			items: g.items.filter((i) => itemDiizinkan(role, i))
		}))
		.filter((g) => g.items.length > 0);
}

/** Semua href yang tampil untuk role (untuk assersi tes). */
export function hrefNavigasi(role: AuthRole): string[] {
	return filterNavigasi(role).flatMap((g) => g.items.map((i) => i.href));
}
