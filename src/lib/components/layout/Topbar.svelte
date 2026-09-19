<script lang="ts">
	import type { Snippet } from 'svelte';
	import { pergiKe } from '$lib/nav';
	import { auth } from '$lib/stores/auth.svelte';
	import NotificationBell from './NotificationBell.svelte';

	let { title = '', children }: { title?: string; children?: Snippet } = $props();

	let menuOpen = $state(false);

	async function logout() {
		menuOpen = false;
		await auth.logout();
		await pergiKe('/login');
	}
</script>

<header class="tanpa-cetak flex h-14 items-center justify-between gap-3 border-b border-brand-100 bg-white px-4">
	<h1 class="truncate text-base font-semibold text-[var(--color-ink)]">{title}</h1>

	<div class="flex items-center gap-3">
		{#if children}
			{@render children()}
		{/if}

		<NotificationBell />

		{#if auth.user}
			<div class="relative">
				<button
					type="button"
					class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50"
					onclick={() => (menuOpen = !menuOpen)}
					aria-expanded={menuOpen}
					aria-haspopup="menu"
				>
					<span class="hidden max-w-[10rem] truncate sm:inline">{auth.user.name}</span>
					<span
						class="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800"
					>
						{auth.user.name.slice(0, 1).toUpperCase()}
					</span>
				</button>

				{#if menuOpen}
					<div
						class="absolute right-0 z-20 mt-1 w-48 rounded-md border border-slate-200 bg-white py-1 shadow-md"
						role="menu"
					>
						<p class="truncate px-3 py-1.5 text-xs text-slate-500">{auth.user.email}</p>
						<button
							type="button"
							class="block w-full px-3 py-2 text-left text-sm text-bahaya hover:bg-red-50"
							role="menuitem"
							onclick={logout}
						>
							Keluar
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</header>

{#if menuOpen}
	<button
		type="button"
		class="fixed inset-0 z-10 cursor-default bg-transparent"
		aria-label="Tutup menu"
		onclick={() => (menuOpen = false)}
	></button>
{/if}
