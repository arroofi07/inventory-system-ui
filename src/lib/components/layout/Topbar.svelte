<script lang="ts">
	import type { Snippet } from 'svelte';
	import { IconLogout, IconMenu2, IconX } from '@tabler/icons-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { pergiKe } from '$lib/nav';
	import { auth } from '$lib/stores/auth.svelte';
	import NotificationBell from './NotificationBell.svelte';

	let {
		title = '',
		open = $bindable(false),
		children
	}: { title?: string; open?: boolean; children?: Snippet } = $props();

	async function logout() {
		await auth.logout();
		await pergiKe('/login');
	}
</script>

<header
	class="tanpa-cetak bg-background sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-primary/15 px-3 sm:gap-3 sm:px-4"
>
	<div class="flex min-w-0 flex-1 items-center gap-2">
		<Button
			type="button"
			variant="ghost"
			size="icon"
			class="shrink-0 lg:hidden"
			onclick={() => (open = !open)}
			aria-expanded={open}
			aria-controls="app-sidebar"
			aria-label={open ? 'Tutup menu' : 'Buka menu'}
		>
			{#if open}
				<IconX />
			{:else}
				<IconMenu2 />
			{/if}
		</Button>
		<h1 class="text-foreground truncate text-base font-semibold">{title}</h1>
	</div>

	<div class="flex shrink-0 items-center gap-1 sm:gap-3">
		{#if children}
			<div class="hidden sm:block">
				{@render children()}
			</div>
		{/if}

		<NotificationBell />

		{#if auth.user}
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Button
							variant="ghost"
							class="flex items-center gap-2 px-1.5 sm:px-2"
							{...props}
						>
							<span class="hidden max-w-[10rem] truncate sm:inline">{auth.user?.name}</span>
							<span
								class="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-full text-xs font-bold"
							>
								{auth.user?.name.slice(0, 1).toUpperCase()}
							</span>
						</Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end" class="w-48">
					<DropdownMenu.Label class="font-normal">
						<span class="text-muted-foreground truncate text-xs">{auth.user.email}</span>
					</DropdownMenu.Label>
					<DropdownMenu.Separator />
					<DropdownMenu.Item variant="destructive" onSelect={() => void logout()}>
						<IconLogout />
						Keluar
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		{/if}
	</div>
</header>
