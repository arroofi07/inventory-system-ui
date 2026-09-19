<script lang="ts">
	let {
		open = $bindable(false),
		message = 'Lanjutkan?',
		onconfirm
	}: {
		open?: boolean;
		message?: string;
		onconfirm?: () => void;
	} = $props();
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
		<div class="w-full max-w-sm rounded-lg bg-white p-4 shadow-lg">
			<p class="text-sm">{message}</p>
			<div class="mt-4 flex justify-end gap-2">
				<button type="button" class="rounded border px-3 py-1.5 text-sm" onclick={() => (open = false)}
					>Batal</button
				>
				<button
					type="button"
					class="rounded bg-slate-900 px-3 py-1.5 text-sm text-white"
					onclick={() => {
						onconfirm?.();
						open = false;
					}}>Ya</button
				>
			</div>
		</div>
	</div>
{/if}
