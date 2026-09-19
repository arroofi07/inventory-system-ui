/**
 * Pratinjau kasar di browser (SC-06) — hanya untuk UX cepat.
 * Submit / angka resmi selalu dari server (`pratinjauTransaksi`).
 */

export type BarisPreview = {
	qty: number;
	harga: string;
	disc1?: string;
	disc2?: string;
	disc3?: string;
};

function toNum(s: string | undefined): number {
	const n = Number.parseFloat(String(s ?? '0').replace(',', '.'));
	return Number.isFinite(n) ? n : 0;
}

/** Diskon berantai persen: v * (1-d1/100) * (1-d2/100) * (1-d3/100). */
export function diskonBerjenjang(nilai: number, d1 = 0, d2 = 0, d3 = 0): number {
	let v = nilai;
	for (const d of [d1, d2, d3]) {
		if (d > 0) v = v * (1 - d / 100);
	}
	return v;
}

export function hitungBarisKasar(baris: BarisPreview): number {
	const sub = baris.qty * toNum(baris.harga);
	return diskonBerjenjang(sub, toNum(baris.disc1), toNum(baris.disc2), toNum(baris.disc3));
}

export type HeaderPreview = {
	items: BarisPreview[];
	disc1Global?: string;
	disc2Global?: string;
	disc3Global?: string;
	ppnPersen?: string;
};

/** Estimasi total_akhir kasar (2 desimal). Bukan sumber kebenaran. */
export function hitungTotalKasar(h: HeaderPreview): {
	grandTotal: string;
	total: string;
	ppnNominal: string;
	totalAkhir: string;
} {
	const grand = h.items.reduce((acc, it) => acc + hitungBarisKasar(it), 0);
	const afterGlobal = diskonBerjenjang(
		grand,
		toNum(h.disc1Global),
		toNum(h.disc2Global),
		toNum(h.disc3Global)
	);
	const ppn = afterGlobal * (toNum(h.ppnPersen ?? '11') / 100);
	const akhir = afterGlobal + ppn;
	const fmt = (n: number) => n.toFixed(2);
	return {
		grandTotal: fmt(grand),
		total: fmt(afterGlobal),
		ppnNominal: fmt(ppn),
		totalAkhir: fmt(akhir)
	};
}
