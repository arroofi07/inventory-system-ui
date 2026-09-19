<script lang="ts">
	interface Props {
		label?: string;
		value?: string;
		hint?: string;
		tone?: 'netral' | 'sukses' | 'peringatan' | 'bahaya';
	}

	let { label = '', value = '', hint = '', tone = 'netral' }: Props = $props();

	const toneClass = $derived(
		tone === 'sukses'
			? 'border-brand-200 bg-brand-50'
			: tone === 'peringatan'
				? 'border-amber-200 bg-amber-50'
				: tone === 'bahaya'
					? 'border-red-200 bg-red-50'
					: 'border-slate-200 bg-white'
	);
</script>

<div class="rounded-[var(--radius-card)] border p-4 {toneClass}">
	<p class="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
	<p class="mt-1 font-display text-2xl text-ink tabular-nums">{value}</p>
	{#if hint}
		<p class="mt-1 text-xs text-muted">{hint}</p>
	{/if}
</div>
