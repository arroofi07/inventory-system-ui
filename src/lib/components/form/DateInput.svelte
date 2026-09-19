<script lang="ts">
	let { value = $bindable('') }: { value?: string } = $props();
</script>

<input class="rounded border border-slate-300 px-2 py-1.5 text-sm" type="date" bind:value />
