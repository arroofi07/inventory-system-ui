<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		onreset?: () => void;
		children: Snippet;
	}

	let { onreset, children }: Props = $props();
</script>

<div
	class="mb-4 flex flex-wrap items-end gap-3 rounded-[var(--radius-card)] border border-slate-200 bg-white p-3"
>
	{@render children()}
	{#if onreset}
		<button
			type="button"
			class="rounded-md border border-slate-200 px-3 py-2 text-sm text-muted hover:bg-surface"
			onclick={onreset}
		>
			Reset
		</button>
	{/if}
</div>
