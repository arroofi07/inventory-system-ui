<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as FieldUi from '$lib/components/ui/field/index.js';

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

<FieldUi.Field data-invalid={error ? 'true' : undefined}>
	{#if label}
		<FieldUi.FieldLabel for={forId}>
			{label}
			{#if required}<span class="text-destructive" aria-hidden="true">*</span>{/if}
		</FieldUi.FieldLabel>
	{/if}
	{@render children()}
	{#if hint && !error}
		<FieldUi.FieldDescription>{hint}</FieldUi.FieldDescription>
	{/if}
	{#if error}
		<FieldUi.FieldError>{error}</FieldUi.FieldError>
	{/if}
</FieldUi.Field>
