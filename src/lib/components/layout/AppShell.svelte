<script lang="ts">
	let { children } = $props();
</script>

<div class="min-h-screen bg-[var(--color-surface)] text-[var(--color-ink)]">
	{@render children()}
</div>
