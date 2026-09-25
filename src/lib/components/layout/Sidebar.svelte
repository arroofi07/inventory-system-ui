<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { filterNavigasi } from '$lib/components/layout/nav-items';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { cn } from '$lib/utils.js';
	import { auth } from '$lib/stores/auth.svelte';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	const grupTampil = $derived(auth.user ? filterNavigasi(auth.user.role) : []);
	const appName = import.meta.env.VITE_APP_NAME ?? 'sistem-barang';

	afterNavigate(() => {
		open = false;
	});
</script>

{#snippet brandHeader()}
	<div class="px-4 py-4">
		<p class="text-primary font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
			{appName}
		</p>
		{#if auth.user}
			<p class="text-muted-foreground mt-0.5 truncate text-xs">{auth.user.role}</p>
		{/if}
	</div>
{/snippet}

{#snippet navLinks()}
	<nav class="flex flex-1 flex-col gap-5 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
		{#each grupTampil as grup (grup.label)}
			<div>
				<p
					class="text-muted-foreground mb-1.5 px-2 text-[0.65rem] font-semibold tracking-wider uppercase"
				>
					{grup.label}
				</p>
				<ul class="space-y-0.5">
					{#each grup.items as item (item.href)}
						{@const aktif =
							page.url.pathname === item.href || page.url.pathname.startsWith(item.href + '/')}
						<li>
							<a
								href={resolve(...([item.href, {}] as unknown as Parameters<typeof resolve>))}
								class={cn(
									'block rounded-md px-2.5 py-2.5 text-sm transition-colors lg:py-1.5',
									aktif
										? 'bg-primary/10 text-primary font-semibold'
										: 'text-foreground/80 hover:bg-primary/8 hover:text-primary'
								)}
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
{/snippet}

<aside
	class="tanpa-cetak border-border bg-background hidden h-full w-60 shrink-0 flex-col overflow-hidden border-r lg:flex"
>
	{@render brandHeader()}
	<Separator />
	<ScrollArea class="min-h-0 flex-1">
		{@render navLinks()}
	</ScrollArea>
</aside>

<Sheet.Root bind:open>
	<Sheet.Content
		id="app-sidebar"
		side="left"
		showCloseButton={false}
		class="tanpa-cetak w-60 gap-0 p-0 sm:max-w-60"
	>
		<Sheet.Header class="sr-only">
			<Sheet.Title>Menu navigasi</Sheet.Title>
			<Sheet.Description>Navigasi utama aplikasi</Sheet.Description>
		</Sheet.Header>
		<div class="flex h-full flex-col overflow-hidden">
			{@render brandHeader()}
			<Separator />
			<ScrollArea class="min-h-0 flex-1">
				{@render navLinks()}
			</ScrollArea>
		</div>
	</Sheet.Content>
</Sheet.Root>
