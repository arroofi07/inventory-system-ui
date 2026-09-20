<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Badge as UiBadge } from '$lib/components/ui/badge/index.js';
	import { cn } from '$lib/utils.js';
	import { toneDariStatus, type BadgeTone } from './badge-tone';

	interface Props {
		/** Teks lencana, atau biarkan children. */
		label?: string;
		/** Warna eksplisit; bila kosong, diturunkan dari `status`. */
		tone?: BadgeTone;
		/** Status domain (LUNAS, PENDING, HABIS, …). */
		status?: string;
		children?: Snippet;
	}

	let { label, tone, status, children }: Props = $props();

	const resolved = $derived(tone ?? (status ? toneDariStatus(status) : 'netral'));

	const badgeStyle = $derived.by(() => {
		switch (resolved) {
			case 'sukses':
				return {
					variant: 'outline' as const,
					className: 'border-transparent bg-primary/15 text-primary'
				};
			case 'peringatan':
				return {
					variant: 'outline' as const,
					className: 'border-transparent bg-amber-100 text-amber-800'
				};
			case 'bahaya':
				return { variant: 'destructive' as const, className: '' };
			case 'info':
				return {
					variant: 'outline' as const,
					className: 'border-transparent bg-blue-100 text-blue-800'
				};
			case 'netral':
				return { variant: 'outline' as const, className: '' };
			default: {
				const _exhaustive: never = resolved;
				return _exhaustive;
			}
		}
	});
</script>

<UiBadge variant={badgeStyle.variant} class={cn(badgeStyle.className)}>
	{#if children}
		{@render children()}
	{:else}
		{label ?? status ?? ''}
	{/if}
</UiBadge>
