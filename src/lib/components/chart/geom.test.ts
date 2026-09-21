import { describe, expect, it } from 'vitest';
import {
	areaPath,
	maxChart,
	nilaiChart,
	persentaseBatang,
	polylinePoints,
	titikGaris
} from './geom';

describe('nilaiChart', () => {
	it('mengabaikan NaN dan string kosong', () => {
		expect(nilaiChart('')).toBe(0);
		expect(nilaiChart('abc')).toBe(0);
		expect(nilaiChart('12500.50')).toBe(12500.5);
	});
});

describe('maxChart', () => {
	it('lantai 1 bila semua nol', () => {
		expect(maxChart([0, 0])).toBe(1);
	});
	it('mengambil nilai terbesar', () => {
		expect(maxChart(['10', '40', '25'])).toBe(40);
	});
});

describe('persentaseBatang', () => {
	it('nol tetap 0 persen', () => {
		expect(persentaseBatang(0, 100)).toBe(0);
	});
	it('nilai kecil tetap terlihat (min 2%)', () => {
		expect(persentaseBatang(1, 1000)).toBe(2);
	});
	it('nilai max = 100%', () => {
		expect(persentaseBatang(40, 40)).toBe(100);
	});
});

describe('titikGaris', () => {
	it('satu titik di tengah', () => {
		const p = titikGaris([10], { width: 100, height: 40, pad: 2 });
		expect(p).toHaveLength(1);
		expect(p[0].x).toBe(50);
	});
	it('titik pertama kiri, terakhir kanan', () => {
		const p = titikGaris([0, 10], { width: 100, height: 40, pad: 2 });
		expect(p[0].x).toBe(0);
		expect(p[1].x).toBe(100);
		expect(p[1].y).toBeLessThan(p[0].y);
	});
});

describe('polylinePoints + areaPath', () => {
	it('format SVG points', () => {
		expect(polylinePoints([{ x: 0, y: 10.25 }])).toBe('0.0,10.3');
	});
	it('area menutup ke dasar', () => {
		const d = areaPath(
			[
				{ x: 0, y: 10 },
				{ x: 100, y: 5 }
			],
			40
		);
		expect(d.startsWith('M 0.0 40.0')).toBe(true);
		expect(d.endsWith('L 100.0 40.0 Z')).toBe(true);
	});
	it('kosong menghasilkan string kosong', () => {
		expect(polylinePoints([])).toBe('');
		expect(areaPath([], 40)).toBe('');
	});
});
