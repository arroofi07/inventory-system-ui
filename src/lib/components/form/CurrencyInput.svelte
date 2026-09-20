<script lang="ts">
	import { tick } from 'svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		formatRupiah,
		formatRupiahKetikan,
		isZeroNumeric,
		parseRupiah,
		posisiKaretSetelahFormat
	} from '$lib/domain/format';

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

	let draf = $state<string | null>(null);
	const tampilan = $derived(draf ?? formatRupiah(value, { tanpaSimbol: true }));

	async function onInput(e: Event) {
		const el = e.currentTarget as HTMLInputElement;
		const karet = el.selectionStart ?? el.value.length;
		const formatted = formatRupiahKetikan(el.value);
		const nextCaret = posisiKaretSetelahFormat(el.value, karet, formatted);
		draf = formatted;
		value = formatted === '' || formatted === '-' ? '0.00' : parseRupiah(formatted);
		await tick();
		el.setSelectionRange(nextCaret, nextCaret);
	}

	function onFocus() {
		if (isZeroNumeric(value) || isZeroNumeric(tampilan)) {
			draf = '';
		}
	}

	function onBlur() {
		value = parseRupiah(draf ?? tampilan);
		draf = null;
	}
</script>

<div class="relative">
	<span
		class="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-sm text-primary/70"
		>Rp</span
	>
	<Input
		{id}
		{name}
		{disabled}
		{placeholder}
		lang="id-ID"
		type="text"
		inputmode="decimal"
		autocomplete="off"
		class="py-2.5 pr-3 pl-10 text-right font-mono text-base tabular-nums md:py-2"
		value={tampilan}
		oninput={onInput}
		onfocus={onFocus}
		onblur={onBlur}
	/>
</div>
