<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLThAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLThAttributes> = $props();
</script>

<th
	bind:this={ref}
	data-slot="table-head"
	class={cn(
		"text-primary h-11 px-4 text-left align-middle text-[0.7rem] font-semibold tracking-wider uppercase whitespace-nowrap [&:has([role=checkbox])]:pr-0",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</th>
