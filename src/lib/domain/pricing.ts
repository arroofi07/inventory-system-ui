import { parseRupiah } from './format';

/** Pratinjau browser; angka tersimpan tetap dari server. */
export const PPN_PERSEN_DEFAULT = '11';

export type MarkupTipe = 'percent' | 'value';

function toNum(s: string | undefined): number {
	const n = Number.parseFloat(parseRupiah(String(s ?? '0')));
	return Number.isFinite(n) ? n : 0;
}

function roundMoney(n: number): string {
	if (!Number.isFinite(n)) return '0.00';
	return (Math.round((n + Number.EPSILON) * 100) / 100).toFixed(2);
}

export function terapkanDiskon(nilai: number, discPersen: number): number {
	if (!discPersen) return nilai;
	return nilai * (1 - discPersen / 100);
}

/** Harga list → disc berantai. Mirror domain.HitungHPP. */
export function hitungHPP(harga: string, disc1: string, disc2: string, disc3: string): string {
	let hasil = toNum(harga);
	for (const d of [disc1, disc2, disc3]) {
		hasil = terapkanDiskon(hasil, toNum(d));
	}
	return roundMoney(hasil);
}

export function hitungHPPDenganPPN(hpp: string, ppnPersen = PPN_PERSEN_DEFAULT): string {
	return roundMoney(toNum(hpp) * (1 + toNum(ppnPersen) / 100));
}

/** Markup dihitung dari harga list, bukan dari HPP. */
export function hitungHargaChannel(harga: string, markupAmount: string, tipe: MarkupTipe): string {
	const h = toNum(harga);
	const m = toNum(markupAmount);
	if (tipe === 'value') return roundMoney(h + m);
	if (tipe !== 'percent') return roundMoney(h);
	return roundMoney(h + (h * m) / 100);
}

/** Selisih bulan penuh dari tanggal masuk ke exp (0 bila exp ≤ masuk). */
export function hitungAgingMonth(tanggalMasuk: string, exp: string): number {
	if (!tanggalMasuk || !exp) return 0;
	const a = Date.parse(`${tanggalMasuk}T00:00:00`);
	const b = Date.parse(`${exp}T00:00:00`);
	if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 0;
	const da = new Date(a);
	const db = new Date(b);
	let months = (db.getFullYear() - da.getFullYear()) * 12 + (db.getMonth() - da.getMonth());
	if (db.getDate() < da.getDate()) months -= 1;
	return months < 0 ? 0 : months;
}

/** @deprecated pakai hitungHPP */
export function hitungHPPPreview(): string {
	return '0';
}
