<script lang="ts">
	type Option = { value: string; label: string; hint?: string };

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
	let rootEl: HTMLDivElement | undefined = $state();
	let debounce: ReturnType<typeof setTimeout> | undefined;

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
		switch (e.key) {
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
			default:
				break;
		}
	}

	function onDocClick(e: MouseEvent) {
		if (rootEl && !rootEl.contains(e.target as Node)) open = false;
	}
</script>

<svelte:window onclick={onDocClick} />

<div class="relative w-full" bind:this={rootEl}>
	<input
		{id}
		{disabled}
		class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50 md:py-2 md:text-sm"
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
			class="absolute z-50 mt-1 max-h-[min(16rem,50vh)] w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
			role="listbox"
		>
			{#if loading}
				<li class="px-3 py-2 text-sm text-muted">Mencari…</li>
			{:else if options.length === 0}
				<li class="px-3 py-2 text-sm text-muted">Tidak ada hasil</li>
			{:else}
				{#each options as opt, i (opt.value)}
					<li role="option" aria-selected={i === highlight}>
						<button
							type="button"
							class="flex min-h-11 w-full flex-col px-3 py-2.5 text-left text-sm hover:bg-surface {i ===
							highlight
								? 'bg-surface'
								: ''}"
							onmousedown={(e) => e.preventDefault()}
							onclick={() => pilih(opt)}
						>
							<span class="font-medium text-ink">{opt.label}</span>
							{#if opt.hint}
								<span class="font-mono text-xs text-muted">{opt.hint}</span>
							{/if}
						</button>
					</li>
				{/each}
			{/if}
		</ul>
	{/if}
</div>
