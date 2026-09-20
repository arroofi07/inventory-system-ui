<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { cn } from '$lib/utils.js';

	type Option = { value: string; label: string; hint?: string };
	type ComboboxKey = 'ArrowDown' | 'ArrowUp' | 'Enter' | 'Escape';

	interface Props {
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		id?: string;
		/** Cari opsi; query kosong → popular. */
		onsearch: (q: string) => Promise<Option[]>;
		onchange?: (opt: Option | null) => void;
	}

	let {
		value = $bindable(''),
		placeholder = 'Cari…',
		disabled = false,
		id,
		onsearch,
		onchange
	}: Props = $props();

	const uid = $props.id();
	const listId = `${uid}-list`;

	let open = $state(false);
	let query = $state('');
	let options = $state<Option[]>([]);
	let loading = $state(false);
	let highlight = $state(0);
	let displayLabel = $state('');
	let debounce: ReturnType<typeof setTimeout> | undefined;

	const tutupSaatKlikLuar: Attachment<HTMLDivElement> = (node) => {
		function onDocClick(e: MouseEvent) {
			if (!node.contains(e.target as Node)) open = false;
		}
		window.addEventListener('click', onDocClick);
		return () => window.removeEventListener('click', onDocClick);
	};

	async function muat(q: string) {
		loading = true;
		try {
			options = await onsearch(q);
			highlight = 0;
		} finally {
			loading = false;
		}
	}

	function jadwalkan(q: string) {
		clearTimeout(debounce);
		debounce = setTimeout(() => void muat(q), 280);
	}

	function pilih(opt: Option) {
		value = opt.value;
		displayLabel = opt.label;
		query = '';
		open = false;
		onchange?.(opt);
	}

	function buka() {
		if (disabled) return;
		open = true;
		void muat(query);
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
				highlight = Math.min(highlight + 1, Math.max(options.length - 1, 0));
				break;
			case 'ArrowUp':
				e.preventDefault();
				highlight = Math.max(highlight - 1, 0);
				break;
			case 'Enter':
				if (open && options[highlight]) {
					e.preventDefault();
					pilih(options[highlight]);
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

<div class="relative w-full" {@attach tutupSaatKlikLuar}>
	<Input
		{id}
		{disabled}
		class="md:py-2"
		placeholder={placeholder}
		value={open ? query : displayLabel || value}
		onfocus={buka}
		onkeydown={onKeydown}
		oninput={(e) => {
			query = (e.currentTarget as HTMLInputElement).value;
			open = true;
			jadwalkan(query);
		}}
		autocomplete="off"
		role="combobox"
		aria-expanded={open}
		aria-controls={listId}
		aria-autocomplete="list"
	/>
	{#if open}
		<ul
			id={listId}
			class="bg-popover text-popover-foreground absolute z-50 mt-1 max-h-[min(16rem,50vh)] w-full overflow-auto rounded-md border py-1 shadow-md"
			role="listbox"
		>
			{#if loading}
				<li class="text-muted-foreground px-3 py-2 text-sm">Mencari…</li>
			{:else if options.length === 0}
				<li class="text-muted-foreground px-3 py-2 text-sm">Tidak ada hasil</li>
			{:else}
				{#each options as opt, i (opt.value)}
					<li role="option" aria-selected={i === highlight}>
						<Button
							type="button"
							variant="ghost"
							class={cn(
								'flex h-auto min-h-11 w-full flex-col items-start justify-center rounded-none px-3 py-2.5 text-left text-sm',
								i === highlight && 'bg-primary/10 text-primary'
							)}
							onmousedown={(e) => e.preventDefault()}
							onclick={() => pilih(opt)}
						>
							<span class="font-medium">{opt.label}</span>
							{#if opt.hint}
								<span class="text-muted-foreground font-mono text-xs">{opt.hint}</span>
							{/if}
						</Button>
					</li>
				{/each}
			{/if}
		</ul>
	{/if}
</div>
