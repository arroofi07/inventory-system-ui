<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLTableRowElement>> = $props();
</script>

<tr
	bind:this={ref}
	data-slot="table-row"
	class={cn(
		"border-border/70 hover:bg-primary/8 data-[state=selected]:bg-primary/10 border-b transition-colors has-aria-expanded:bg-primary/5",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</tr>
