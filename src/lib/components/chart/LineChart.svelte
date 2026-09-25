<script lang="ts">
	import { areaPath, polylinePoints, titikGaris } from './geom';

	let {
		labels = [],
		values = [],
		emptyText = 'Tidak ada data',
		ariaLabel = 'Grafik garis'
	}: {
		labels?: string[];
		values?: Array<number | string>;
		emptyText?: string;
		ariaLabel?: string;
	} = $props();

	const kosong = $derived(labels.length === 0 || values.length === 0);
	const points = $derived(titikGaris(values));
	const garis = $derived(polylinePoints(points));
	const area = $derived(areaPath(points, 40));
	const labelTengah = $derived(labels.length > 2 ? labels[Math.floor(labels.length / 2)] : undefined);
</script>

{#if kosong}
	<p class="text-sm text-muted-foreground">{emptyText}</p>
{:else}
	<div>
		<svg
			viewBox="0 0 100 40"
			class="h-28 w-full overflow-visible"
			role="img"
			aria-label={ariaLabel}  
		>
			<path d={area} class="fill-brand-600/20" />
			<polyline
				fill="none"
				stroke="currentColor"
				stroke-width="0.8"
				class="text-brand-700"
				points={garis}
			/>
			{#each points as p, i (`${p.x}-${p.y}-${i}`)}
				<circle cx={p.x} cy={p.y} r="1.1" class="fill-brand-700" />
			{/each}
		</svg>
		<div class="mt-1 flex justify-between text-xs text-muted-foreground tabular-nums">
			<span>{labels[0]}</span>
			{#if labelTengah}
				<span>{labelTengah}</span>
			{/if}
			{#if labels.length > 1}
				<span>{labels[labels.length - 1]}</span>
			{/if}
		</div>
	</div>
{/if}
