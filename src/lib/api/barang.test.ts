import { describe, expect, it } from 'vitest';
import { pathTambahStok } from './barang';

describe('barang api helpers', () => {
	it('pathTambahStok deep-link encode kode', () => {
		expect(pathTambahStok('ABC-01')).toBe('/barang-masuk/baru?kode_barang=ABC-01');
		expect(pathTambahStok('A/B 1')).toBe('/barang-masuk/baru?kode_barang=A%2FB%201');
	});
});
