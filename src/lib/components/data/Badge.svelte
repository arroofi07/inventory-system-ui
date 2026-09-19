<script lang="ts">
	import type { Snippet } from 'svelte';
	import { toneDariStatus, type BadgeTone } from './badge-tone';

	interface Props {
		/** Teks lencana, atau biarkan children. */
		label?: string;
		/** Warna eksplisit; bila kosong, diturunkan dari `status`. */
		tone?: BadgeTone;
		/** Status domain (LUNAS, PENDING, HABIS, …). */
		status?: string;
		children?: Snippet;
	}

	let { label, tone, status, children }: Props = $props();

	const resolved = $derived(tone ?? (status ? toneDariStatus(status) : 'netral'));
</script>

<span
	class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide {resolved ===
	'sukses'
		? 'bg-brand-100 text-brand-800'
		: resolved === 'peringatan'
			? 'bg-amber-100 text-amber-800'
			: resolved === 'bahaya'
				? 'bg-red-100 text-red-800'
				: resolved === 'info'
					? 'bg-blue-100 text-blue-800'
					: 'bg-slate-100 text-slate-700'}"
>
	{#if children}
		{@render children()}
	{:else}
		{label ?? status ?? ''}
	{/if}
</span>
