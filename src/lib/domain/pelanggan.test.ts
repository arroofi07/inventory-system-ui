import { describe, expect, it } from 'vitest';
import {
	kodePelangganDariNama,
	prefixKodePelangganDariNama,
	suffixKodePelangganAcak
} from './pelanggan';

describe('prefixKodePelangganDariNama', () => {
	it('mengambil 3 huruf awal dari dua kata pertama', () => {
		expect(prefixKodePelangganDariNama('Toko Budiman')).toBe('TOKBUD');
		expect(prefixKodePelangganDariNama('Toko Sejahtera Jaya')).toBe('TOKSEJ');
	});

	it('kata tunggal diambil 6 huruf awal', () => {
		expect(prefixKodePelangganDariNama('Budiman')).toBe('BUDIMA');
	});

	it('mengembalikan string kosong bila nama kosong', () => {
		expect(prefixKodePelangganDariNama('')).toBe('');
		expect(prefixKodePelangganDariNama('   ---   ')).toBe('');
	});
});

describe('kodePelangganDariNama', () => {
	it('menyusun prefix + 4 digit suffix', () => {
		expect(kodePelangganDariNama('Toko Budiman', '5187')).toBe('TOKBUD5187');
	});

	it('suffix acak selalu 4 digit', () => {
		const suffix = suffixKodePelangganAcak();
		expect(suffix).toMatch(/^\d{4}$/);
		expect(Number(suffix)).toBeGreaterThanOrEqual(1000);
		expect(Number(suffix)).toBeLessThanOrEqual(9999);
	});
});
