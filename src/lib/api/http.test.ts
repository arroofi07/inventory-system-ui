import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch, bindAuthToken } from './http';

describe('apiFetch silent refresh', () => {
	let access: string | null = 'expired-token';
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		access = 'expired-token';
		bindAuthToken(
			() => access,
			(t) => {
				access = t;
			}
		);
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		bindAuthToken(
			() => null,
			() => {}
		);
	});

	it('401 → refresh → retry tanpa gagal ke pemanggil', async () => {
		const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
			const url = String(input);
			if (url.includes('/auth/refresh')) {
				return new Response(JSON.stringify({ data: { access_token: 'fresh-token' } }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			}
			const auth = new Headers(init?.headers).get('Authorization');
			if (auth === 'Bearer expired-token') {
				return new Response(
					JSON.stringify({ error: { code: 'TIDAK_TERAUTENTIKASI', message: 'expired' } }),
					{ status: 401, headers: { 'Content-Type': 'application/json' } }
				);
			}
			if (auth === 'Bearer fresh-token') {
				return new Response(JSON.stringify({ data: { ok: true } }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			}
			return new Response('unexpected', { status: 500 });
		});
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const res = await apiFetch<{ data: { ok: boolean } }>('/me');
		expect(res.data.ok).toBe(true);
		expect(access).toBe('fresh-token');
		expect(fetchMock.mock.calls.some((c) => String(c[0]).includes('/auth/refresh'))).toBe(true);
	});

	it('401 dan refresh gagal → ApiError', async () => {
		globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url.includes('/auth/refresh')) {
				return new Response('no', { status: 401 });
			}
			return new Response(
				JSON.stringify({ error: { code: 'TIDAK_TERAUTENTIKASI', message: 'expired' } }),
				{ status: 401, headers: { 'Content-Type': 'application/json' } }
			);
		}) as unknown as typeof fetch;

		await expect(apiFetch('/me')).rejects.toBeInstanceOf(ApiError);
		expect(access).toBeNull();
	});
});
