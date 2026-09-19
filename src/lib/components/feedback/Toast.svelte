<script lang="ts">
	import { dismissToast, getToasts, type ToastTone } from '$lib/stores/toast.svelte';

	const toasts = $derived(getToasts());

	function toneClass(tone: ToastTone): string {
		switch (tone) {
			case 'sukses':
				return 'bg-brand-800 text-white';
			case 'peringatan':
				return 'bg-amber-700 text-white';
			case 'bahaya':
				return 'bg-bahaya text-white';
			default:
				return 'bg-ink text-white';
		}
	}
</script>

<div class="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(100%,22rem)] flex-col gap-2">
	{#each toasts as t (t.id)}
		<div
			class="pointer-events-auto flex items-start gap-3 rounded-lg px-4 py-3 text-sm shadow-lg {toneClass(
				t.tone
			)}"
			role="status"
		>
			<p class="flex-1">{t.message}</p>
			<button type="button" class="opacity-80 underline" onclick={() => dismissToast(t.id)}
				>Tutup</button
			>
		</div>
	{/each}
</div>
