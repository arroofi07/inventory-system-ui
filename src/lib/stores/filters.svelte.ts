import { goto } from '$app/navigation';
import { page } from '$app/state';
import { bacaFilterDariUrl, bangunQueryFilter } from './filters';

export { bacaFilterDariUrl, bangunQueryFilter, parseFilters } from './filters';

/**
 * Menyinkronkan objek filter dengan query string URL.
 * Perubahan memakai replaceState agar tombol kembali tidak menelusuri setiap ketikan.
 */
export function buatFilterStore<T extends Record<string, string | undefined>>(bawaan: T) {
	let nilai = $state<T>({ ...bawaan, ...bacaFilterDariUrl(page.url, bawaan) });

	async function terapkan(patch: Partial<T>) {
		nilai = { ...nilai, ...patch };
		await goto(bangunQueryFilter(nilai), { replaceState: true, keepFocus: true, noScroll: true });
	}

	function reset() {
		return terapkan({ ...bawaan });
	}

	return {
		get nilai() {
			return nilai;
		},
		terapkan,
		reset
	};
}
