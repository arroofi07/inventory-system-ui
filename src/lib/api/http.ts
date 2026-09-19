export type ApiErrorBody = {
	code: string;
	message: string;
	details?: { field: string; message: string }[];
};

export class ApiError extends Error {
	status: number;
	body: ApiErrorBody;

	constructor(status: number, body: ApiErrorBody) {
		super(body.message);
		this.status = status;
		this.body = body;
	}
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

type TokenGetter = () => string | null;
type TokenSetter = (token: string | null) => void;

let getAccessToken: TokenGetter = () => null;
let setAccessToken: TokenSetter = () => {};

export function bindAuthToken(getter: TokenGetter, setter: TokenSetter) {
	getAccessToken = getter;
	setAccessToken = setter;
}

/** Satu refresh bersama — request paralel mengantri pada promise yang sama. */
let refreshPromise: Promise<boolean> | null = null;

async function cobaRefresh(): Promise<boolean> {
	if (refreshPromise) return refreshPromise;

	refreshPromise = (async () => {
		try {
			const res = await fetch(`${API_BASE}/auth/refresh`, {
				method: 'POST',
				credentials: 'include'
			});
			if (!res.ok) {
				setAccessToken(null);
				return false;
			}
			const json = (await res.json()) as {
				data?: { access_token?: string };
			};
			const token = json.data?.access_token ?? null;
			setAccessToken(token);
			return Boolean(token);
		} catch {
			setAccessToken(null);
			return false;
		} finally {
			refreshPromise = null;
		}
	})();

	return refreshPromise;
}

import { mockApiFetch, useMockApi } from '$lib/mocks/handlers';

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
	if (useMockApi() && !path.startsWith('/auth/')) {
		const mocked = await mockApiFetch<T>(path, init);
		if (mocked !== null) {
			return mocked;
		}
	}

	const isAuthRoute = path.startsWith('/auth/');

	// Antre: tunggu refresh yang sedang jalan sebelum mengirim request baru.
	if (refreshPromise && !isAuthRoute) {
		await refreshPromise;
	}

	const headers = new Headers(init.headers);
	const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
	if (!headers.has('Content-Type') && init.body && !isFormData) {
		headers.set('Content-Type', 'application/json');
	}

	const token = getAccessToken();
	if (token && !headers.has('Authorization')) {
		headers.set('Authorization', `Bearer ${token}`);
	}

	let res = await fetch(`${API_BASE}${path}`, {
		...init,
		headers,
		credentials: 'include'
	});

	if (res.status === 401 && !isAuthRoute) {
		const ok = await cobaRefresh();
		if (ok) {
			const retryHeaders = new Headers(init.headers);
			const retryForm = typeof FormData !== 'undefined' && init.body instanceof FormData;
			if (!retryHeaders.has('Content-Type') && init.body && !retryForm) {
				retryHeaders.set('Content-Type', 'application/json');
			}
			const next = getAccessToken();
			if (next) retryHeaders.set('Authorization', `Bearer ${next}`);
			res = await fetch(`${API_BASE}${path}`, {
				...init,
				headers: retryHeaders,
				credentials: 'include'
			});
		}
	}

	if (!res.ok) {
		let body: ApiErrorBody = { code: 'HTTP_ERROR', message: res.statusText };
		try {
			const json = await res.json();
			if (json?.error) body = json.error;
		} catch {
			/* ignore */
		}
		throw new ApiError(res.status, body);
	}

	if (res.status === 204) {
		return undefined as T;
	}
	return (await res.json()) as T;
}

/** Unduh file (CSV) dengan auth + refresh sama seperti apiFetch. */
export async function apiDownload(path: string, fallbackName: string): Promise<void> {
	if (refreshPromise) {
		await refreshPromise;
	}

	const headers = new Headers();
	const token = getAccessToken();
	if (token) headers.set('Authorization', `Bearer ${token}`);

	let res = await fetch(`${API_BASE}${path}`, {
		headers,
		credentials: 'include'
	});

	if (res.status === 401) {
		const ok = await cobaRefresh();
		if (ok) {
			const retryHeaders = new Headers();
			const next = getAccessToken();
			if (next) retryHeaders.set('Authorization', `Bearer ${next}`);
			res = await fetch(`${API_BASE}${path}`, {
				headers: retryHeaders,
				credentials: 'include'
			});
		}
	}

	if (!res.ok) {
		let body: ApiErrorBody = { code: 'HTTP_ERROR', message: res.statusText };
		try {
			const json = await res.json();
			if (json?.error) body = json.error;
		} catch {
			/* ignore */
		}
		throw new ApiError(res.status, body);
	}

	const cd = res.headers.get('Content-Disposition') ?? '';
	const m = /filename="([^"]+)"/.exec(cd);
	const filename = m?.[1] ?? fallbackName;
	const blob = await res.blob();
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}
