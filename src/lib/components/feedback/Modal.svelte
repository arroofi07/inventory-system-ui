<script lang="ts">
	import type { Snippet } from 'svelte';

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

	let dialogEl: HTMLDialogElement | undefined = $state();

	$effect(() => {
		const el = dialogEl;
		if (!el) return;
		if (open) {
			if (!el.open) el.showModal();
		} else if (el.open) {
			el.close();
		}
	});

	function onClose() {
		open = false;
	}
</script>

<dialog
	bind:this={dialogEl}
	class="w-[min(100%,28rem)] max-h-[90vh] rounded-[var(--radius-card)] border-0 bg-white p-0 shadow-xl backdrop:bg-ink/40"
	onclose={onClose}
	onclick={(e) => {
		if (e.target === dialogEl) dialogEl?.close();
	}}
>
	<div class="flex max-h-[90vh] flex-col">
		<header class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
			<h2 class="font-display text-lg text-ink">{title}</h2>
			<button
				type="button"
				class="text-sm text-muted hover:text-ink"
				onclick={() => dialogEl?.close()}
			>
				Tutup
			</button>
		</header>
		<div class="overflow-auto px-4 py-3">
			{#if children}
				{@render children()}
			{/if}
		</div>
		{#if footer}
			<footer class="border-t border-slate-100 px-4 py-3">
				{@render footer()}
			</footer>
		{/if}
	</div>
</dialog>
