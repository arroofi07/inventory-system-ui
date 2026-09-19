import { describe, expect, it } from 'vitest';
import {
	formatRupiah,
	formatRupiahKetikan,
	isZeroNumeric,
	parseRupiah,
	posisiKaretSetelahFormat
} from './format';

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

describe('isZeroNumeric', () => {
	it('mengenali nol dalam format input dan tampilan', () => {
		expect(isZeroNumeric(0)).toBe(true);
		expect(isZeroNumeric('0')).toBe(true);
		expect(isZeroNumeric('0.00')).toBe(true);
		expect(isZeroNumeric('0,00')).toBe(true);
		expect(isZeroNumeric('00')).toBe(true);
	});

	it('tidak menganggap kosong atau nilai lain sebagai nol', () => {
		expect(isZeroNumeric('')).toBe(false);
		expect(isZeroNumeric(null)).toBe(false);
		expect(isZeroNumeric('1')).toBe(false);
		expect(isZeroNumeric('0.01')).toBe(false);
		expect(isZeroNumeric('1.000')).toBe(false);
	});
});

describe('formatRupiahKetikan', () => {
	it('menambah titik ribuan saat diketik tanpa memaksa desimal', () => {
		expect(formatRupiahKetikan('')).toBe('');
		expect(formatRupiahKetikan('5')).toBe('5');
		expect(formatRupiahKetikan('2000')).toBe('2.000');
		expect(formatRupiahKetikan('20000')).toBe('20.000');
		expect(formatRupiahKetikan('1.2345')).toBe('12.345');
		expect(formatRupiahKetikan('20000,')).toBe('20.000,');
		expect(formatRupiahKetikan('20000,5')).toBe('20.000,5');
		expect(formatRupiahKetikan('20000,501')).toBe('20.000,50');
	});

	it('memahami paste barat 1234.56 sebagai desimal id-ID', () => {
		expect(formatRupiahKetikan('1234.56')).toBe('1.234,56');
		expect(formatRupiahKetikan('1.234.567')).toBe('1.234.567');
	});

	it('round-trip ke nilai kanonik', () => {
		expect(parseRupiah(formatRupiahKetikan('20000,5'))).toBe('20000.50');
		expect(parseRupiah(formatRupiahKetikan('20.000'))).toBe('20000.00');
	});
});

describe('posisiKaretSetelahFormat', () => {
	it('menjaga karet di akhir setelah titik ribuan muncul', () => {
		expect(posisiKaretSetelahFormat('2000', 4, '2.000')).toBe(5);
		expect(posisiKaretSetelahFormat('2.0005', 6, '20.005')).toBe(6);
	});
});
