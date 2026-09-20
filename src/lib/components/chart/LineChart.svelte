<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';

	let { labels = [], values = [] }: { labels?: string[]; values?: number[] } = $props();
</script>

<Card.Root class="gap-0 border border-primary/20 bg-white p-4 shadow-none ring-0">
	<Card.Content class="p-0 text-sm text-primary/70">
		Line chart placeholder ({labels.length} label, {values.length} nilai)
	</Card.Content>
</Card.Root>
