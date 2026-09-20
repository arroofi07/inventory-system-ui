<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';

	interface Props {
		open?: boolean;
		title?: string;
		children?: Snippet;
		footer?: Snippet;
	}

	let {
		open = $bindable(false),
		title = '',
		children,
		footer
	}: Props = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		showCloseButton={true}
		class="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-md"
	>
		<Dialog.Header class="border-b px-4 py-3 pr-12">
			<Dialog.Title>{title}</Dialog.Title>
		</Dialog.Header>
		<div class="min-h-0 flex-1 overflow-auto px-4 py-3">
			{#if children}
				{@render children()}
			{/if}
		</div>
		{#if footer}
			<Dialog.Footer class="border-t px-4 py-3 sm:justify-start">
				{@render footer()}
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
