import { describe, expect, it } from 'vitest';
import { diskonBerjenjang, hitungTotalKasar } from './preview';

describe('preview kasar transaksi', () => {
	it('diskon berjenjang 10 lalu 5', () => {
		expect(diskonBerjenjang(200_000, 10, 5, 0)).toBeCloseTo(171_000, 5);
	});

	it('total kasar DPP 300k + PPN 11% = 333000', () => {
		const r = hitungTotalKasar({
			items: [
				{ qty: 1, harga: '200000.00' },
				{ qty: 1, harga: '100000.00' }
			],
			ppnPersen: '11.00'
		});
		expect(r.total).toBe('300000.00');
		expect(r.ppnNominal).toBe('33000.00');
		expect(r.totalAkhir).toBe('333000.00');
	});
});
