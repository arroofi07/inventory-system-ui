<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { cn } from '$lib/utils.js';
	import { isZeroNumeric } from '$lib/domain/format';

	interface Props {
		/** Nilai persen sebagai string desimal, misalnya "11.00". */
		value?: string;
		disabled?: boolean;
		id?: string;
		min?: number;
		max?: number;
		class?: string;
	}

	let {
		value = $bindable('0'),
		disabled = false,
		id,
		min = 0,
		max = 100,
		class: className = 'w-28'
	}: Props = $props();

	let draf = $state<string | null>(null);
	const tampilan = $derived(draf ?? value);

	function normalize(raw: string): string {
		const cleaned = raw.replace(',', '.').replace(/[^\d.]/g, '');
		const n = Number.parseFloat(cleaned);
		if (!Number.isFinite(n)) return String(min);
		const clamped = Math.min(max, Math.max(min, n));
		return String(clamped);
	}

	function onFocus() {
		if (isZeroNumeric(value) || isZeroNumeric(tampilan)) {
			draf = '';
		}
	}

	function onInput(e: Event) {
		draf = (e.currentTarget as HTMLInputElement).value;
		if (draf.trim() !== '') {
			value = draf.replace(',', '.');
		}
	}

	function onBlur() {
		const raw = draf ?? tampilan;
		value = raw.trim() === '' ? String(min) : normalize(raw);
		draf = null;
	}
</script>

<div class={cn('relative inline-flex', className)}>
	<Input
		{id}
		{disabled}
		type="text"
		inputmode="decimal"
		class="pr-8 text-right font-mono text-sm tabular-nums"
		value={tampilan}
		onfocus={onFocus}
		oninput={onInput}
		onblur={onBlur}
	/>
	<span
		class="pointer-events-none absolute top-1/2 right-2 z-10 -translate-y-1/2 text-sm text-primary/70"
		>%</span
	>
</div>
