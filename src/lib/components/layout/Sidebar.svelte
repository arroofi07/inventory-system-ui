<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { filterNavigasi } from '$lib/components/layout/nav-items';
	import { auth } from '$lib/stores/auth.svelte';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	const grupTampil = $derived(auth.user ? filterNavigasi(auth.user.role) : []);

	afterNavigate(() => {
		open = false;
	});

	function tutup() {
		open = false;
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) tutup();
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
	<button
		type="button"
		class="tanpa-cetak fixed inset-0 top-14 z-30 bg-ink/40 lg:hidden"
		aria-label="Tutup menu"
		onclick={tutup}
	></button>
{/if}

<aside
	id="app-sidebar"
	class={[
		'tanpa-cetak flex w-60 shrink-0 flex-col overflow-hidden border-r border-brand-100 bg-white',
		'fixed top-14 bottom-0 left-0 z-40 shadow-xl transition-transform duration-200',
		'lg:static lg:z-auto lg:h-full lg:shadow-none lg:translate-x-0',
		open ? 'translate-x-0' : '-translate-x-full'
	]}
>
	<div class="border-b border-brand-100 px-4 py-4">
		<p class="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-brand-800">
			PKB Web
		</p>
		{#if auth.user}
			<p class="mt-0.5 truncate text-xs text-[var(--color-muted)]">{auth.user.role}</p>
		{/if}
	</div>

	<nav class="flex flex-1 flex-col gap-5 overflow-y-auto p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
		{#each grupTampil as grup (grup.label)}
			<div>
				<p class="mb-1.5 px-2 text-[0.65rem] font-semibold tracking-wider text-slate-400 uppercase">
					{grup.label}
				</p>
				<ul class="space-y-0.5">
					{#each grup.items as item (item.href)}
						{@const aktif =
							page.url.pathname === item.href || page.url.pathname.startsWith(item.href + '/')}
						<li>
							<a
								href={resolve(...([item.href, {}] as unknown as Parameters<typeof resolve>))}
								class={[
									'block rounded-md px-2.5 py-2.5 text-sm transition-colors lg:py-1.5',
									aktif
										? 'bg-brand-50 font-semibold text-brand-800'
										: 'text-slate-700 hover:bg-slate-50'
								]}
								aria-current={aktif ? 'page' : undefined}
							>
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	</nav>
</aside>
