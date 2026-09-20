<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';

	let { value = $bindable('') }: { value?: string } = $props();
</script>

<Input type="date" class="w-auto" bind:value />
