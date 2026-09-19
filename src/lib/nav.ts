import { goto } from '$app/navigation';
import { resolve } from '$app/paths';

type ResolveFn = (path: string, params?: Record<string, never>) => string;

/**
 * Wrapper resolve. Cast lewat unknown karena quirk ResolveArgs
 * (SvelteKit + TypeScript 6) yang selalu menuntut 2 argumen.
 */
export function resolveAppPath(pathname: string): string {
	return (resolve as unknown as ResolveFn)(pathname, {});
}

export function pergiKe(pathname: string, opts?: Parameters<typeof goto>[1]) {
	return goto(resolveAppPath(pathname), opts);
}
