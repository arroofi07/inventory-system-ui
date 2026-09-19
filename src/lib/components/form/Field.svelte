<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		label?: string;
		error?: string;
		hint?: string;
		required?: boolean;
		forId?: string;
		children: Snippet;
	}

	let {
		label = '',
		error = '',
		hint = '',
		required = false,
		forId,
		children
	}: Props = $props();
</script>

<div class="flex flex-col gap-1 text-sm">
	{#if label}
		<label class="font-medium text-ink" for={forId}>
			{label}
			{#if required}<span class="text-bahaya" aria-hidden="true">*</span>{/if}
		</label>
	{/if}
	{@render children()}
	{#if hint && !error}
		<p class="text-xs text-muted">{hint}</p>
	{/if}
	{#if error}
		<p class="text-xs text-bahaya" role="alert">{error}</p>
	{/if}
</div>
