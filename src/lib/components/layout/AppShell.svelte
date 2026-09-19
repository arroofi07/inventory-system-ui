<script lang="ts">
	let { children } = $props();
</script>

<div
	class="h-dvh overflow-hidden bg-[var(--color-surface)] text-[var(--color-ink)] print:h-auto print:overflow-visible"
>
	{@render children()}
</div>
