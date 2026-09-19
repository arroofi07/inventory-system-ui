import { describe, expect, it } from 'vitest';
import { bacaFilterDariUrl, bangunQueryFilter } from '../stores/filters';
import { mockApiFetch } from '../mocks/handlers';
import { toneDariStatus } from './data/badge-tone';

describe('toneDariStatus', () => {
	it('memetakan status ke tone', () => {
		expect(toneDariStatus('LUNAS')).toBe('sukses');
		expect(toneDariStatus('PENDING')).toBe('peringatan');
		expect(toneDariStatus('HABIS')).toBe('bahaya');
		expect(toneDariStatus('???')).toBe('netral');
	});
});

describe('filter URL helpers', () => {
	it('membaca dan membangun query', () => {
		const url = new URL('http://x.test/barang?q=shs&page=2');
		expect(bacaFilterDariUrl(url, { q: '', page: '1', status: '' })).toEqual({
			q: 'shs',
			page: '2'
		});
		expect(bangunQueryFilter({ q: 'a', page: '1', status: '' })).toBe('?q=a&page=1');
	});
});

describe('mock OpenAPI handlers', () => {
	it('mengembalikan daftar barang paginasi', async () => {
		const res = await mockApiFetch<{
			data: { kode_barang: string }[];
			meta: { total: number };
		}>('/barang?page=1&per_page=20');
		expect(res).not.toBeNull();
		expect(res!.data.length).toBeGreaterThan(0);
		expect(res!.meta.total).toBeGreaterThan(0);
		expect(res!.data[0].kode_barang).toBe('SHS001');
	});

	it('menyaring status_stok', async () => {
		const res = await mockApiFetch<{ data: { status_stok: string }[] }>(
			'/barang?status_stok=HABIS'
		);
		expect(res).not.toBeNull();
		expect(res!.data.every((r) => r.status_stok === 'HABIS')).toBe(true);
	});
});
