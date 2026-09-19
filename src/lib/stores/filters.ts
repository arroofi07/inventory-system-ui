/** Baca subset kunci filter dari URL. */
export function bacaFilterDariUrl<T extends Record<string, string | undefined>>(
	url: URL,
	bentuk: T
): Partial<T> {
	const hasil: Record<string, string> = {};
	for (const kunci of Object.keys(bentuk)) {
		const v = url.searchParams.get(kunci);
		if (v !== null) hasil[kunci] = v;
	}
	return hasil as Partial<T>;
}

/** Bangun query string dari objek filter (abaikan kosong). */
export function bangunQueryFilter(nilai: Record<string, string | undefined>): string {
	const params = new URLSearchParams();
	for (const [k, v] of Object.entries(nilai)) {
		if (v !== undefined && v !== '') params.set(k, String(v));
	}
	const s = params.toString();
	return s ? `?${s}` : '?';
}

/** @deprecated nama lama. */
export function parseFilters(url: URL): Record<string, string> {
	const out: Record<string, string> = {};
	url.searchParams.forEach((v, k) => {
		out[k] = v;
	});
	return out;
}
