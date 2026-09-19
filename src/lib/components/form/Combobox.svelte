<script lang="ts">
	type Option = { value: string; label: string };

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
	let rootEl: HTMLDivElement | undefined = $state();

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return options;
		return options.filter(
			(o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
		);
	});

	const selectedLabel = $derived(options.find((o) => o.value === value)?.label ?? '');

	function pilih(opt: Option) {
		value = opt.value;
		query = '';
		open = false;
		onchange?.(opt.value);
	}

	function onKeydown(e: KeyboardEvent) {
		if (disabled) return;
		switch (e.key) {
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
			default:
				break;
		}
	}

	function onDocClick(e: MouseEvent) {
		if (rootEl && !rootEl.contains(e.target as Node)) open = false;
	}
</script>

<svelte:window onclick={onDocClick} />

<div class="relative w-full min-w-0" bind:this={rootEl}>
	<input
		{id}
		{disabled}
		type="text"
		role="combobox"
		aria-expanded={open}
		aria-autocomplete="list"
		aria-controls={id ? `${id}-list` : undefined}
		class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50 md:py-2 md:text-sm"
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
			class="absolute z-50 mt-1 max-h-[min(16rem,50vh)] w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-md"
		>
			{#if filtered.length === 0}
				<li class="px-3 py-2 text-sm text-muted">Tidak ada pilihan</li>
			{:else}
				{#each filtered as opt, i (opt.value)}
					<li role="option" aria-selected={opt.value === value}>
						<button
							type="button"
							class="flex min-h-11 w-full px-3 py-2.5 text-left text-sm hover:bg-brand-50 {i === highlight
								? 'bg-brand-50'
								: ''}"
							onmouseenter={() => (highlight = i)}
							onclick={() => pilih(opt)}
						>
							{opt.label}
						</button>
					</li>
				{/each}
			{/if}
		</ul>
	{/if}
</div>
