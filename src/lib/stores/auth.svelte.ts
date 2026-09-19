import { bindAuthToken, apiFetch, ApiError } from '$lib/api/http';
import type { AuthRole } from '$lib/auth/permissions';
import { punyaIzin, punyaSalahSatu } from '$lib/auth/permissions';
import type { Permission } from '$lib/auth/permissions';

export type { AuthRole };
export type AuthUser = {
	id: number;
	name: string;
	email: string;
	role: AuthRole;
	is_active: boolean;
};

type LoginResponse = {
	data: {
		access_token: string;
		token_type: string;
		expires_in: number;
		user: AuthUser;
	};
};

type MeResponse = {
	data: {
		id: number;
		name: string;
		email: string;
		role: AuthRole;
	};
};

class AuthStore {
	user = $state<AuthUser | null>(null);
	accessToken = $state<string | null>(null);
	siap = $state(false);
	sedangMemulihkan = $state(false);

	constructor() {
		bindAuthToken(
			() => this.accessToken,
			(token) => {
				this.accessToken = token;
			}
		);
	}

	get terautentikasi() {
		return Boolean(this.accessToken && this.user);
	}

	isAdminRole(role: AuthRole = this.user?.role ?? 'sales') {
		return role === 'super_admin' || role === 'admin' || role === 'afiliasi';
	}

	/** Semua role ke dashboard; isi kartu disesuaikan API. */
	dashboardPath() {
		return '/dashboard';
	}

	punyaIzin(p: Permission) {
		if (!this.user) return false;
		return punyaIzin(this.user.role, p);
	}

	punyaSalahSatu(...ps: Permission[]) {
		if (!this.user) return false;
		return punyaSalahSatu(this.user.role, ps);
	}

	async login(email: string, password: string) {
		const res = await apiFetch<LoginResponse>('/auth/login', {
			method: 'POST',
			body: JSON.stringify({ email, password })
		});
		this.accessToken = res.data.access_token;
		this.user = res.data.user;
		this.siap = true;
		return res.data.user;
	}

	async logout() {
		try {
			await apiFetch<void>('/auth/logout', { method: 'POST' });
		} catch {
			/* logout tetap membersihkan sesi lokal */
		}
		this.accessToken = null;
		this.user = null;
	}

	async pulihkanSesi() {
		if (this.sedangMemulihkan) return;
		this.sedangMemulihkan = true;
		try {
			const res = await apiFetch<LoginResponse>('/auth/refresh', { method: 'POST' });
			this.accessToken = res.data.access_token;
			this.user = res.data.user;
		} catch (err) {
			this.accessToken = null;
			this.user = null;
			if (!(err instanceof ApiError && (err.status === 401 || err.status === 204))) {
				/* biarkan siap=true */
			}
		} finally {
			this.siap = true;
			this.sedangMemulihkan = false;
		}
	}

	async muatProfil() {
		const res = await apiFetch<MeResponse>('/me');
		this.user = {
			id: res.data.id,
			name: res.data.name,
			email: res.data.email,
			role: res.data.role,
			is_active: true
		};
	}
}

export const auth = new AuthStore();
