import { describe, expect, it } from 'vitest';
import { hitungPosisiPanel } from './dropdown-pos';

describe('hitungPosisiPanel', () => {
	const viewport = { width: 1280, height: 800 };

	it('membuka ke bawah bila ruang cukup', () => {
		const p = hitungPosisiPanel(
			{ top: 80, left: 40, bottom: 120, width: 240, height: 40 },
			viewport
		);
		expect(p.top).toBe(124);
		expect(p.left).toBe(40);
		expect(p.width).toBe(240);
		expect(p.maxHeight).toBeGreaterThan(96);
	});

	it('membuka ke atas bila dekat tepi bawah', () => {
		const p = hitungPosisiPanel(
			{ top: 740, left: 40, bottom: 780, width: 240, height: 40 },
			viewport
		);
		expect(p.top).toBeLessThan(740);
		expect(p.top + p.maxHeight).toBeLessThanOrEqual(740);
	});

	it('menjaga panel tetap di dalam viewport horizontal', () => {
		const p = hitungPosisiPanel(
			{ top: 80, left: 1200, bottom: 120, width: 240, height: 40 },
			viewport
		);
		expect(p.left + p.width).toBeLessThanOrEqual(viewport.width - 8);
		expect(p.left).toBeGreaterThanOrEqual(8);
	});
});
