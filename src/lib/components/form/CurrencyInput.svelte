<script lang="ts">
	import { formatRupiah, parseRupiah } from '$lib/domain/format';

	interface Props {
		/** Nilai string desimal kanonik, misalnya "20000.00". */
		value?: string;
		disabled?: boolean;
		id?: string;
		name?: string;
		placeholder?: string;
	}

	let {
		value = $bindable('0.00'),
		disabled = false,
		id,
		name,
		placeholder = '0,00'
	}: Props = $props();

	let tampilan = $state(formatRupiah(value, { tanpaSimbol: true }));
	let sedangFokus = $state(false);

	$effect(() => {
		if (!sedangFokus) {
			tampilan = formatRupiah(value, { tanpaSimbol: true });
		}
	});

	function onInput(e: Event) {
		const mentah = (e.currentTarget as HTMLInputElement).value;
		tampilan = mentah;
		value = parseRupiah(mentah);
	}

	function onFocus() {
		sedangFokus = true;
	}

	function onBlur() {
		sedangFokus = false;
		value = parseRupiah(tampilan);
		tampilan = formatRupiah(value, { tanpaSimbol: true });
	}
</script>

<div class="relative">
	<span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted"
		>Rp</span
	>
	<input
		{id}
		{name}
		{disabled}
		{placeholder}
		type="text"
		inputmode="decimal"
		autocomplete="off"
		class="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-right font-mono text-base tabular-nums focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50 md:py-2 md:text-sm"
		value={tampilan}
		oninput={onInput}
		onfocus={onFocus}
		onblur={onBlur}
	/>
</div>
