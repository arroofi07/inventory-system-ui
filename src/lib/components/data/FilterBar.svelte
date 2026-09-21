<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	interface Props {
		onreset?: () => void;
		children: Snippet;
	}

	let { onreset, children }: Props = $props();
</script>

<Card.Root
	class="border-border/80 relative z-20 mb-4 gap-0 overflow-visible! py-0 shadow-sm"
	size="sm"
>
	<Card.Content
		class="grid grid-cols-1 items-end gap-3 overflow-visible p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
	>
		{@render children()}
		{#if onreset}
			<div class="flex items-end">
				<Button type="button" variant="outline" class="min-h-11 w-full sm:w-auto" onclick={onreset}>
					Reset
				</Button>
			</div>
		{/if}
	</Card.Content>
</Card.Root>
