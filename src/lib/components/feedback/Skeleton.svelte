<script lang="ts">
	import { Skeleton as UiSkeleton } from '$lib/components/ui/skeleton/index.js';

	let { class: className = '' }: { class?: string } = $props();
</script>

<UiSkeleton class={className} />
