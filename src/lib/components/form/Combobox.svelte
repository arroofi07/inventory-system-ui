<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { cn } from '$lib/utils.js';

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

	let open = $state(false);
	let query = $state('');
	let highlight = $state(0);

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return options;
		return options.filter(
			(o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
		);
	});

	const selectedLabel = $derived(options.find((o) => o.value === value)?.label ?? '');

	const tutupSaatKlikLuar: Attachment<HTMLDivElement> = (node) => {
		function onDocClick(e: MouseEvent) {
			if (!node.contains(e.target as Node)) open = false;
		}
		window.addEventListener('click', onDocClick);
		return () => window.removeEventListener('click', onDocClick);
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

<div class="relative w-full min-w-0" {@attach tutupSaatKlikLuar}>
	<Input
		{id}
		{disabled}
		type="text"
		role="combobox"
		aria-expanded={open}
		aria-autocomplete="list"
		aria-controls={id ? `${id}-list` : undefined}
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
	{#if open && !disabled}
		<ul
			id={id ? `${id}-list` : undefined}
			role="listbox"
			class="bg-popover text-popover-foreground absolute z-50 mt-1 max-h-[min(16rem,50vh)] w-full overflow-auto rounded-md border py-1 shadow-md"
		>
			{#if filtered.length === 0}
				<li class="text-muted-foreground px-3 py-2 text-sm">Tidak ada pilihan</li>
			{:else}
				{#each filtered as opt, i (opt.value)}
					<li role="option" aria-selected={opt.value === value}>
						<Button
							type="button"
							variant="ghost"
							class={cn(
								'h-auto min-h-11 w-full justify-start rounded-none px-3 py-2.5 text-left text-sm',
								i === highlight && 'bg-primary/10 text-primary'
							)}
							onmouseenter={() => (highlight = i)}
							onclick={() => pilih(opt)}
						>
							{opt.label}
						</Button>
					</li>
				{/each}
			{/if}
		</ul>
	{/if}
</div>
