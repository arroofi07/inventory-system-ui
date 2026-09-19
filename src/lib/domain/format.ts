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
