import { MOCK_BARANG, MOCK_PELANGGAN, type MockBarang, type PageMeta } from './fixtures';

function pageMeta(total: number, page: number, perPage: number): PageMeta {
	const totalPages = Math.max(1, Math.ceil(total / perPage));
	return { page, per_page: perPage, total, total_pages: totalPages };
}

function paginate<T>(items: T[], page: number, perPage: number): T[] {
	const start = (page - 1) * perPage;
	return items.slice(start, start + perPage);
}

/**
 * Mock handler dari kontrak openapi-draft.yaml untuk skeleton halaman.
 * Dipakai bila VITE_USE_MOCK=true.
 */
export async function mockApiFetch<T>(path: string, init: RequestInit = {}): Promise<T | null> {
	const url = new URL(path, 'http://mock.local');
	const method = (init.method ?? 'GET').toUpperCase();
	await new Promise((r) => setTimeout(r, 120));

	if (method === 'GET' && url.pathname === '/barang') {
		const q = (url.searchParams.get('q') ?? '').toLowerCase();
		const page = Number(url.searchParams.get('page') ?? '1') || 1;
		const perPage = Number(url.searchParams.get('per_page') ?? '20') || 20;
		let rows: MockBarang[] = MOCK_BARANG.filter((b) => b.is_active);
		if (q) {
			rows = rows.filter(
				(b) =>
					b.kode_barang.toLowerCase().includes(q) ||
					b.nama_item.toLowerCase().includes(q) ||
					b.brand.toLowerCase().includes(q)
			);
		}
		const status = url.searchParams.get('status_stok');
		if (status) rows = rows.filter((b) => b.status_stok === status);
		const includeInactive = url.searchParams.get('include_inactive') === 'true';
		const isActiveParam = url.searchParams.get('is_active');
		if (isActiveParam !== null) {
			const want = isActiveParam === 'true';
			rows = rows.filter((b) => b.is_active === want);
		} else if (!includeInactive) {
			rows = rows.filter((b) => b.is_active);
		}
		return {
			data: paginate(rows, page, perPage),
			meta: pageMeta(rows.length, page, perPage)
		} as T;
	}

	if (method === 'GET' && url.pathname === '/pelanggan') {
		const page = Number(url.searchParams.get('page') ?? '1') || 1;
		const perPage = Number(url.searchParams.get('per_page') ?? '20') || 20;
		return {
			data: paginate(MOCK_PELANGGAN, page, perPage),
			meta: pageMeta(MOCK_PELANGGAN.length, page, perPage)
		} as T;
	}

	if (method === 'GET' && url.pathname === '/dashboard') {
		return {
			data: {
				role: 'admin',
				kartu: {
					transaksi_pending: 4,
					penjualan_bulan_ini: '12500000.00',
					total_piutang: '7360500.00',
					piutang_overdue: '3500000.00',
					sku_stok_rendah: 2,
					sku_stok_habis: 1,
					batch_mendekati_exp: 3
				},
				aktivitas_terkini: {
					transaksi_pending: [],
					barang_masuk: [],
					pembayaran: []
				},
				notifikasi_piutang: { overdue: 2, mendekati_jatuh_tempo: 1 }
			}
		} as T;
	}

	return null;
}

export function useMockApi(): boolean {
	return import.meta.env.VITE_USE_MOCK === 'true';
}
