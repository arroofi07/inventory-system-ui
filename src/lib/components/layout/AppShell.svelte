<script lang="ts">
	let { children } = $props();
</script>

<div class="bg-background text-foreground h-dvh overflow-hidden print:h-auto print:overflow-visible">
	{@render children()}
</div>
