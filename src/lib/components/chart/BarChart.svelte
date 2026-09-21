<script lang="ts">
	import { maxChart, nilaiChart, persentaseBatang } from './geom';

	let {
		labels = [],
		values = [],
		captions = [],
		formatValue = (n: number) => String(n),
		emptyText = 'Tidak ada data',
		ariaLabel = 'Grafik batang'
	}: {
		labels?: string[];
		values?: Array<number | string>;
		captions?: string[];
		formatValue?: (n: number) => string;
		emptyText?: string;
		ariaLabel?: string;
	} = $props();

	const kosong = $derived(labels.length === 0 || values.length === 0);
	const max = $derived(maxChart(values));
</script>

{#if kosong}
	<p class="text-sm text-muted-foreground">{emptyText}</p>
{:else}
	<div class="space-y-2" role="img" aria-label={ariaLabel}>
		{#each labels as label, i (`${label}-${i}`)}
			{@const nilai = values[i] ?? 0}
			{@const lebar = persentaseBatang(nilai, max)}
			{@const caption = captions[i]}
			<div>
				<div class="mb-1 flex justify-between gap-3 text-sm text-foreground">
					<span>{label}</span>
					<span class="text-right tabular-nums">
						{formatValue(nilaiChart(nilai))}
						{#if caption}
							<span class="text-muted-foreground"> · {caption}</span>
						{/if}
					</span>
				</div>
				<div class="h-2 overflow-hidden rounded bg-primary/10">
					<div
						class="h-full rounded bg-brand-600 transition-[width] duration-500"
						style:width="{lebar}%"
					></div>
				</div>
			</div>
		{/each}
	</div>
{/if}
