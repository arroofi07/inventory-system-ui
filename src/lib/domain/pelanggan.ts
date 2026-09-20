function normalisasiKata(word: string): string {
	return word
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-zA-Z0-9]/g, '')
		.toUpperCase();
}

function potongKata(word: string, mulai: number): string {
	return normalisasiKata(word).slice(mulai, mulai + 3);
}

/** Prefix 6 huruf: 3 huruf awal kata pertama + 3 huruf awal kata kedua. */
export function prefixKodePelangganDariNama(nama: string): string {
	const words = nama.trim().split(/\s+/).filter(Boolean);
	if (words.length === 0) return '';
	if (words.length === 1) {
		return (potongKata(words[0], 0) + potongKata(words[0], 3)).slice(0, 6);
	}
	return (potongKata(words[0], 0) + potongKata(words[1], 0)).slice(0, 6);
}

/** Empat digit acak (1000–9999) untuk uniqueness. */
export function suffixKodePelangganAcak(): string {
	return String(Math.floor(1000 + Math.random() * 9000));
}

/** Kode preview: prefix dari nama + 4 digit (contoh: Toko Budiman → TOKBUD5187). */
export function kodePelangganDariNama(nama: string, suffix?: string): string {
	const prefix = prefixKodePelangganDariNama(nama);
	if (!prefix) return '';
	const angka = suffix ?? suffixKodePelangganAcak();
	return `${prefix}${angka}`.slice(0, 32);
}
