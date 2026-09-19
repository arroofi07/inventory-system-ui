import { describe, expect, it } from 'vitest';
import {
	hitungAgingMonth,
	hitungHargaChannel,
	hitungHPP,
	hitungHPPDenganPPN,
	hitungNominalPPN
} from './pricing';

describe('hitungHPP berantai', () => {
	it('tiga tingkat 23.1 → 2 → 5 dari 20000', () => {
		const hpp = hitungHPP('20000.00', '23.10', '2.00', '5.00');
		expect(hpp).toBe('14318.78');
		expect(hitungHPPDenganPPN(hpp)).toBe('15893.85');
	});

	it('tanpa diskon + PPN 11%', () => {
		expect(hitungHPP('10000.00', '0', '0', '0')).toBe('10000.00');
		expect(hitungHPPDenganPPN('10000.00')).toBe('11100.00');
		expect(hitungNominalPPN('10000.00')).toBe('1100.00');
	});

	it('disc 100% menolkan HPP sehingga PPN juga 0', () => {
		const hpp = hitungHPP('10000.00', '5', '30', '100');
		expect(hpp).toBe('0.00');
		expect(hitungNominalPPN(hpp)).toBe('0.00');
		expect(hitungHPPDenganPPN(hpp)).toBe('0.00');
	});
});

describe('hitungHargaChannel', () => {
	it('markup persen dari harga list', () => {
		expect(hitungHargaChannel('20000.00', '15.00', 'percent')).toBe('23000.00');
	});

	it('markup nilai ditambah ke harga list', () => {
		expect(hitungHargaChannel('20000.00', '2500.00', 'value')).toBe('22500.00');
	});
});

describe('hitungAgingMonth', () => {
	it('dari tanggal masuk ke exp dalam bulan penuh', () => {
		expect(hitungAgingMonth('2026-09-01', '2027-06-30')).toBe(9);
	});

	it('0 bila exp belum lewat tanggal masuk', () => {
		expect(hitungAgingMonth('2026-09-01', '2026-09-01')).toBe(0);
		expect(hitungAgingMonth('2026-09-01', '')).toBe(0);
	});
});
