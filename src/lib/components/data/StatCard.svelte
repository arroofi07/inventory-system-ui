<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { cn } from '$lib/utils.js';

	interface Props {
		label?: string;
		value?: string;
		hint?: string;
		tone?: 'netral' | 'sukses' | 'peringatan' | 'bahaya';
	}

	let { label = '', value = '', hint = '', tone = 'netral' }: Props = $props();

	const toneClass = $derived.by(() => {
		switch (tone) {
			case 'netral':
				return 'border-border/80 bg-card';
			case 'sukses':
				return 'border-primary/20 bg-primary/5';
			case 'peringatan':
				return 'border-amber-200 bg-amber-50';
			case 'bahaya':
				return 'border-destructive/25 bg-destructive/5';
			default: {
				const _exhaustive: never = tone;
				return _exhaustive;
			}
		}
	});
</script>

<Card.Root class={cn('gap-0 border p-4 shadow-sm', toneClass)}>
	<p class="text-muted-foreground text-[0.7rem] font-semibold tracking-wider uppercase">{label}</p>
	<p class="text-foreground mt-1 font-display text-2xl tabular-nums tracking-tight">{value}</p>
	{#if hint}
		<p class="text-muted-foreground mt-1 text-xs">{hint}</p>
	{/if}
</Card.Root>
