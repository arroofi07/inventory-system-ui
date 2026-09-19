/**
 * Format & parse uang sebagai string desimal agar tidak kehilangan
 * presisi Number (batas aman ~15 digit signifikan).
 */

export type FormatRupiahOpts = {
	/** Tanpa prefix "Rp " (untuk input). */
	tanpaSimbol?: boolean;
	/** Jumlah digit desimal (default 2). */
	desimal?: number;
};

/** Normalisasi ke string desimal kanonik "1234.56" (titik desimal, tanpa pemisah ribuan). */
export function parseRupiah(mentah: string): string {
	let s = mentah.trim().replace(/Rp\.?/gi, '').replace(/\s/g, '');
	if (!s) return '0.00';

	const punyaKoma = s.includes(',');
	const punyaTitik = s.includes('.');

	if (punyaKoma && punyaTitik) {
		// id-ID: 1.234.567,89
		s = s.replace(/\./g, '').replace(',', '.');
	} else if (punyaKoma) {
		s = s.replace(',', '.');
	} else if (punyaTitik) {
		const parts = s.split('.');
		if (parts.length > 2) {
			// 1.234.567 → ribuan
			s = parts.join('');
		} else if (parts.length === 2 && parts[1].length > 2) {
			// 1.234 → kemungkinan ribuan tanpa desimal
			s = parts.join('');
		}
		// else: 1234.56 biarkan
	}

	s = s.replace(/[^\d.-]/g, '');
	const neg = s.startsWith('-');
	s = s.replace(/-/g, '');
	if (!s || s === '.') return '0.00';

	const [intRaw = '0', fracRaw = ''] = s.split('.');
	const intPart = intRaw.replace(/^0+(?=\d)/, '') || '0';
	const frac = (fracRaw + '00').slice(0, 2);
	return `${neg ? '-' : ''}${intPart}.${frac}`;
}

/** True bila tampilan/input angka bernilai nol (0, 0.00, 0,00). String kosong bukan nol. */
export function isZeroNumeric(raw: string | number | null | undefined): boolean {
	if (raw === null || raw === undefined) return false;
	const s = String(raw).trim();
	if (s === '' || s === '-' || s === '.' || s === ',') return false;
	const canon = parseRupiah(s);
	return canon === '0.00' || canon === '-0.00';
}

/** Format tampilan id-ID. Menerima string desimal atau number kecil. */
export function formatRupiah(value: string | number, opts: FormatRupiahOpts = {}): string {
	const desimal = opts.desimal ?? 2;
	const canon =
		typeof value === 'number'
			? Number.isFinite(value)
				? value.toFixed(desimal)
				: '0.00'
			: parseRupiah(String(value));

	const neg = canon.startsWith('-');
	const abs = neg ? canon.slice(1) : canon;
	const [intPart, fracPart = '00'] = abs.split('.');
	const denganRibuan = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
	const frac = (fracPart + '0'.repeat(desimal)).slice(0, desimal);
	const body = desimal > 0 ? `${denganRibuan},${frac}` : denganRibuan;
	const signed = neg ? `-${body}` : body;
	return opts.tanpaSimbol ? signed : `Rp ${signed}`;
}

/**
 * Format ketikan harga id-ID: ribuan bertitik, desimal berkoma (maks 2 digit).
 * Tidak memaksa ",00" supaya koma masih bisa diketik.
 */
export function formatRupiahKetikan(mentah: string): string {
	let s = mentah.replace(/Rp\.?/gi, '').replace(/\s/g, '');
	if (!s) return '';
	const neg = s.startsWith('-');
	if (neg) s = s.slice(1);
	if (!s) return neg ? '-' : '';

	const hasComma = s.includes(',');
	let intDigits: string;
	let frac: string | undefined;
	let keepComma = false;

	if (hasComma) {
		const i = s.indexOf(',');
		intDigits = s.slice(0, i).replace(/\D/g, '');
		frac = s.slice(i + 1).replace(/\D/g, '').slice(0, 2);
		keepComma = true;
	} else {
		const dotted = s.replace(/[^\d.]/g, '');
		const parts = dotted.split('.');
		if (parts.length === 2 && parts[1].length >= 1 && parts[1].length <= 2) {
			intDigits = parts[0].replace(/\D/g, '');
			frac = parts[1];
			keepComma = true;
		} else {
			intDigits = s.replace(/\D/g, '');
		}
	}

	intDigits = intDigits.replace(/^0+(?=\d)/, '');
	if (intDigits === '') {
		if (!keepComma) return neg ? '-' : '';
		intDigits = '0';
	}

	const intFmt = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
	const body = keepComma ? `${intFmt},${frac ?? ''}` : intFmt;
	return `${neg ? '-' : ''}${body}`;
}

/** Geser karet setelah pemisah ribuan disisipkan, berdasarkan digit/koma sebelum karet. */
export function posisiKaretSetelahFormat(sebelum: string, karet: number, sesudah: string): number {
	const sig = (sebelum.slice(0, Math.max(0, karet)).match(/[\d,]/g) ?? []).length;
	if (sig <= 0) return 0;
	let seen = 0;
	for (let i = 0; i < sesudah.length; i++) {
		if (/[\d,]/.test(sesudah[i] ?? '')) {
			seen += 1;
			if (seen === sig) return i + 1;
		}
	}
	return sesudah.length;
}
