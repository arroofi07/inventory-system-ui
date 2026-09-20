<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { ModeWatcher, setMode } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { auth } from '$lib/stores/auth.svelte';

	let { children } = $props();

	onMount(() => {
		setMode('light');
		document.documentElement.classList.remove('dark');
		document.documentElement.style.colorScheme = 'light';
		void auth.pulihkanSesi();
	});
</script>

<ModeWatcher defaultMode="light" track={false} />
<Toaster theme="light" position="bottom-right" richColors closeButton />

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=JetBrains+Mono:wght@400;500&family=Source+Sans+3:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

{@render children()}
