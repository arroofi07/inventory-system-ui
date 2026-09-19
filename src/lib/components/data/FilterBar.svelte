<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		onreset?: () => void;
		children: Snippet;
	}

	let { onreset, children }: Props = $props();
</script>

<div
	class="mb-4 grid grid-cols-1 gap-3 rounded-[var(--radius-card)] border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
>
	{@render children()}
	{#if onreset}
		<div class="flex items-end">
			<button
				type="button"
				class="min-h-11 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-muted hover:bg-surface sm:w-auto"
				onclick={onreset}
			>
				Reset
			</button>
		</div>
	{/if}
</div>
