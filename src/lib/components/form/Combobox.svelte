<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import { Portal } from 'bits-ui';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { cn } from '$lib/utils.js';
	import { pasangPanelDropdown } from '$lib/components/form/dropdown-pos';

	type Option = { value: string; label: string };
	type ComboboxKey = 'ArrowDown' | 'ArrowUp' | 'Enter' | 'Escape';

	interface Props {
		options?: Option[];
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		id?: string;
		onchange?: (value: string) => void;
	}

	let {
		options = [],
		value = $bindable(''),
		placeholder = 'Pilih…',
		disabled = false,
		id,
		onchange
	}: Props = $props();

	const uid = $props.id();
	const listId = $derived(id ? `${id}-list` : `${uid}-list`);

	let open = $state(false);
	let query = $state('');
	let highlight = $state(0);
	let triggerEl = $state<HTMLDivElement | null>(null);

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return options;
		return options.filter(
			(o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
		);
	});

	const selectedLabel = $derived(options.find((o) => o.value === value)?.label ?? '');

	const pasangTrigger: Attachment<HTMLDivElement> = (node) => {
		triggerEl = node;
		function onDocClick(e: Event) {
			const t = e.target as Node;
			if (node.contains(t)) return;
			const panel = document.getElementById(listId);
			if (panel?.contains(t)) return;
			open = false;
		}
		window.addEventListener('pointerdown', onDocClick, true);
		return () => {
			if (triggerEl === node) triggerEl = null;
			window.removeEventListener('pointerdown', onDocClick, true);
		};
	};

	function pilih(opt: Option) {
		value = opt.value;
		query = '';
		open = false;
		onchange?.(opt.value);
	}

	function onKeydown(e: KeyboardEvent) {
		if (disabled) return;
		const key = e.key;
		if (key !== 'ArrowDown' && key !== 'ArrowUp' && key !== 'Enter' && key !== 'Escape') {
			return;
		}
		const action: ComboboxKey = key;
		switch (action) {
			case 'ArrowDown':
				e.preventDefault();
				open = true;
				highlight = Math.min(highlight + 1, Math.max(filtered.length - 1, 0));
				break;
			case 'ArrowUp':
				e.preventDefault();
				open = true;
				highlight = Math.max(highlight - 1, 0);
				break;
			case 'Enter':
				if (open && filtered[highlight]) {
					e.preventDefault();
					pilih(filtered[highlight]);
				}
				break;
			case 'Escape':
				open = false;
				break;
			default: {
				const _exhaustive: never = action;
				return _exhaustive;
			}
		}
	}
</script>

<div class="relative w-full min-w-0" {@attach pasangTrigger}>
	<Input
		{id}
		{disabled}
		type="text"
		role="combobox"
		aria-expanded={open}
		aria-autocomplete="list"
		aria-controls={listId}
		class="md:py-2"
		placeholder={selectedLabel || placeholder}
		value={open ? query : selectedLabel}
		onfocus={() => {
			open = true;
			query = '';
		}}
		oninput={(e) => {
			query = (e.currentTarget as HTMLInputElement).value;
			open = true;
			highlight = 0;
		}}
		onkeydown={onKeydown}
	/>
</div>
{#if open && !disabled}
	<Portal>
		<ul
			id={listId}
			role="listbox"
			data-combobox-panel
			class="bg-popover text-popover-foreground fixed z-80 overflow-auto rounded-md border py-1 shadow-md"
			{@attach triggerEl && pasangPanelDropdown(triggerEl)}
		>
			{#if filtered.length === 0}
				<li class="text-muted-foreground px-3 py-2 text-sm">Tidak ada pilihan</li>
			{:else}
				{#each filtered as opt, i (opt.value || '__empty__')}
					<li role="option" aria-selected={opt.value === value}>
						<Button
							type="button"
							variant="ghost"
							class={cn(
								'h-auto min-h-11 w-full justify-start rounded-none px-3 py-2.5 text-left text-sm',
								i === highlight && 'bg-primary/10 text-primary'
							)}
							onmousedown={(e) => e.preventDefault()}
							onmouseenter={() => (highlight = i)}
							onclick={() => pilih(opt)}
						>
							{opt.label}
						</Button>
					</li>
				{/each}
			{/if}
		</ul>
	</Portal>
{/if}
