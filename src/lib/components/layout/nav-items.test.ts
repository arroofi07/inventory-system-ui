import { describe, expect, it } from 'vitest';
import type { AuthRole } from '../../auth/permissions';
import { filterNavigasi, hrefNavigasi } from './nav-items';

describe('filterNavigasi per role', () => {
	it('super_admin melihat channel analytics dan users', () => {
		const hrefs = hrefNavigasi('super_admin');
		expect(hrefs).toContain('/channel-analytics');
		expect(hrefs).toContain('/users');
		expect(hrefs).toContain('/approval');
		expect(hrefs).toContain('/dashboard');
	});

	it('admin boleh approval dan analytics', () => {
		const hrefs = hrefNavigasi('admin');
		expect(hrefs).toContain('/approval');
		expect(hrefs).toContain('/channel-analytics');
		expect(hrefs).toContain('/users');
	});

	it('afiliasi tanpa analytics/users; approval read-only', () => {
		const hrefs = hrefNavigasi('afiliasi');
		expect(hrefs).toContain('/dashboard');
		expect(hrefs).toContain('/barang');
		expect(hrefs).toContain('/promo');
		expect(hrefs).toContain('/approval');
		expect(hrefs).not.toContain('/channel-analytics');
		expect(hrefs).not.toContain('/users');
	});

	it('sales hanya menu operasional milik sendiri', () => {
		const hrefs = hrefNavigasi('sales');
		expect(hrefs).toEqual(
			expect.arrayContaining(['/dashboard', '/transaksi', '/barang', '/pelanggan', '/promo'])
		);
		expect(hrefs).not.toContain('/approval');
		expect(hrefs).not.toContain('/users');
		expect(hrefs).not.toContain('/channel-analytics');
		expect(hrefs).not.toContain('/piutang');
		expect(hrefs).not.toContain('/pembayaran');
		expect(hrefs).not.toContain('/barang-masuk');
	});

	it('tidak ada grup kosong untuk semua role', () => {
		const roles: AuthRole[] = ['super_admin', 'admin', 'afiliasi', 'sales'];
		for (const role of roles) {
			const groups = filterNavigasi(role);
			expect(groups.length).toBeGreaterThan(0);
			for (const g of groups) {
				expect(g.items.length).toBeGreaterThan(0);
			}
		}
	});
});
