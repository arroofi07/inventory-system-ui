import { describe, expect, it } from 'vitest';
import { formatRupiah, parseRupiah } from './format';

describe('formatRupiah / parseRupiah', () => {
	it('formats integer-like values with id-ID separators', () => {
		expect(formatRupiah('150000')).toMatch(/150\.000/);
		expect(formatRupiah(150000, { tanpaSimbol: true })).toBe('150.000,00');
	});

	it('returns Rp 0,00 for invalid input', () => {
		expect(formatRupiah('bukan-angka')).toMatch(/0/);
	});

	it('tidak kehilangan presisi 15 digit (melebihi Number.MAX_SAFE_INTEGER)', () => {
		const besar = '123456789012345.99';
		expect(parseRupiah(besar)).toBe('123456789012345.99');
		expect(formatRupiah(besar, { tanpaSimbol: true })).toBe('123.456.789.012.345,99');
		// Number akan kehilangan digit — pastikan path string tidak memakai Number untuk body.
		expect(Number(besar).toString()).not.toBe(besar);
	});

	it('parse input bertitik ribuan dan koma desimal', () => {
		expect(parseRupiah('1.234.567,89')).toBe('1234567.89');
		expect(parseRupiah('Rp 99,60')).toBe('99.60');
	});

	it('round-trip CurrencyInput value "1234567890.99"', () => {
		const v = '1234567890.99';
		expect(parseRupiah(formatRupiah(v, { tanpaSimbol: true }))).toBe(v);
	});
});
