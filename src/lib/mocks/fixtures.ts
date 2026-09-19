/** Fixture mock selaras skema OpenAPI `Barang` + `PageMeta` (docs/openapi-draft.yaml). */

export type MockBarang = {
	id: number;
	kode_barang: string;
	nama_item: string;
	brand: string;
	satuan: string;
	stok_tersedia: number;
	min_stock: number;
	reorder_point: number;
	status_stok: 'NORMAL' | 'RENDAH' | 'HABIS';
	metode_alokasi: 'FEFO' | 'FIFO';
	expiry_alert_days: number;
	jumlah_batch_tersedia: number;
	is_active: boolean;
};

export type PageMeta = {
	page: number;
	per_page: number;
	total: number;
	total_pages: number;
};

export const MOCK_BARANG: MockBarang[] = [
	{
		id: 1,
		kode_barang: 'SHS001',
		nama_item: 'Shisena Hand Body Lotion 100ml',
		brand: 'Nalpamara',
		satuan: 'PCS',
		stok_tersedia: 148,
		min_stock: 24,
		reorder_point: 48,
		status_stok: 'NORMAL',
		metode_alokasi: 'FEFO',
		expiry_alert_days: 30,
		jumlah_batch_tersedia: 3,
		is_active: true
	},
	{
		id: 2,
		kode_barang: 'MSK014',
		nama_item: 'Maskara Soft Black',
		brand: 'Nalpamara',
		satuan: 'PCS',
		stok_tersedia: 12,
		min_stock: 20,
		reorder_point: 30,
		status_stok: 'RENDAH',
		metode_alokasi: 'FEFO',
		expiry_alert_days: 30,
		jumlah_batch_tersedia: 1,
		is_active: true
	},
	{
		id: 3,
		kode_barang: 'LIP022',
		nama_item: 'Lip Tint Coral',
		brand: 'PKB Care',
		satuan: 'PCS',
		stok_tersedia: 0,
		min_stock: 10,
		reorder_point: 15,
		status_stok: 'HABIS',
		metode_alokasi: 'FIFO',
		expiry_alert_days: 45,
		jumlah_batch_tersedia: 0,
		is_active: true
	}
];

export type MockPelanggan = {
	kode_pelanggan: string;
	nama: string;
	channel_outlet: string;
	area: string;
	is_active: boolean;
};

export const MOCK_PELANGGAN: MockPelanggan[] = [
	{
		kode_pelanggan: 'PLG001',
		nama: 'Toko Maju Jaya',
		channel_outlet: 'General Trade',
		area: 'Jakarta Timur',
		is_active: true
	},
	{
		kode_pelanggan: 'PLG002',
		nama: 'Indomaret Cabang A',
		channel_outlet: 'Modern Trade',
		area: 'Bekasi',
		is_active: true
	}
];
