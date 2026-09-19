import { apiFetch } from '$lib/api/http';
import type { PageMeta } from '$lib/api/barang';

export type UserRole = 'super_admin' | 'admin' | 'afiliasi' | 'sales';

/** Role yang boleh dipilih di form CRUD (SB-07). */
export const USER_FORM_ROLES: { value: 'sales' | 'afiliasi'; label: string }[] = [
	{ value: 'sales', label: 'Sales' },
	{ value: 'afiliasi', label: 'Afiliasi' }
];

export type User = {
	id: number;
	name: string;
	email: string;
	role: UserRole | string;
	no_hp?: string | null;
	no_ktp?: string | null;
	alamat?: string | null;
	jenis_kelamin?: 'L' | 'P' | string | null;
	is_active: boolean;
	created_at?: string;
	updated_at?: string;
};

export type UserListParams = {
	q?: string;
	page?: number;
	per_page?: number;
	sort?: string;
	role?: string;
	include_inactive?: boolean;
};

export type UserCreateBody = {
	name: string;
	email: string;
	password: string;
	role: 'sales' | 'afiliasi';
	no_hp?: string | null;
	no_ktp?: string | null;
	alamat?: string | null;
	jenis_kelamin?: 'L' | 'P' | null;
	is_active?: boolean;
};

export type UserUpdateBody = {
	name?: string;
	email?: string;
	password?: string;
	role?: 'sales' | 'afiliasi';
	no_hp?: string | null;
	no_ktp?: string | null;
	alamat?: string | null;
	jenis_kelamin?: 'L' | 'P' | null;
};

function buildQuery(params: UserListParams): string {
	const qs = new URLSearchParams();
	if (params.q) qs.set('q', params.q);
	if (params.page) qs.set('page', String(params.page));
	if (params.per_page) qs.set('per_page', String(params.per_page));
	if (params.sort) qs.set('sort', params.sort);
	if (params.role) qs.set('role', params.role);
	if (params.include_inactive) qs.set('include_inactive', 'true');
	const s = qs.toString();
	return s ? `?${s}` : '';
}

export async function daftarUsers(params: UserListParams = {}) {
	return apiFetch<{ data: User[]; meta: PageMeta }>(`/users${buildQuery(params)}`);
}

export async function detailUser(id: number) {
	return apiFetch<{ data: User }>(`/users/${id}`);
}

export async function buatUser(body: UserCreateBody) {
	return apiFetch<{ data: User }>('/users', {
		method: 'POST',
		body: JSON.stringify(body)
	});
}

export async function ubahUser(id: number, body: UserUpdateBody) {
	return apiFetch<{ data: User }>(`/users/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(body)
	});
}

export async function setStatusUser(id: number, is_active: boolean) {
	return apiFetch<{ data: User }>(`/users/${id}/status`, {
		method: 'PATCH',
		body: JSON.stringify({ is_active })
	});
}

export async function hapusUser(id: number) {
	return apiFetch<void>(`/users/${id}`, { method: 'DELETE' });
}
