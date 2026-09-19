<script lang="ts">
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

	function normalize(raw: string): string {
		const cleaned = raw.replace(',', '.').replace(/[^\d.]/g, '');
		const n = Number.parseFloat(cleaned);
		if (!Number.isFinite(n)) return String(min);
		const clamped = Math.min(max, Math.max(min, n));
		return String(clamped);
	}

	function onInput(e: Event) {
		value = (e.currentTarget as HTMLInputElement).value;
	}

	function onBlur() {
		value = normalize(value);
	}
</script>

<div class={['relative inline-flex', className]}>
	<input
		{id}
		{disabled}
		type="text"
		inputmode="decimal"
		class="w-full rounded-lg border border-slate-300 py-2 pl-2 pr-8 text-right font-mono text-sm tabular-nums focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
		{value}
		oninput={onInput}
		onblur={onBlur}
	/>
	<span class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted"
		>%</span
	>
</div>
