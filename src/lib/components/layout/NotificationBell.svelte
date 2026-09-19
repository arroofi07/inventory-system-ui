<script lang="ts">
	import { notifikasiPiutang } from '$lib/api/piutang';
	import { auth } from '$lib/stores/auth.svelte';
	import { resolveAppPath } from '$lib/nav';

	let overdue = $state(0);
	let nearDue = $state(0);
	const total = $derived(overdue + nearDue);
	const boleh = $derived(auth.punyaIzin('pembayaran.lihat'));

	async function muat() {
		if (!boleh) {
			overdue = 0;
			nearDue = 0;
			return;
		}
		try {
			const res = await notifikasiPiutang();
			overdue = res.data.overdue;
			nearDue = res.data.mendekati_jatuh_tempo;
		} catch {
			/* diam: bell tidak memblok UI */
		}
	}

	$effect(() => {
		if (!boleh) return;
		void muat();
		const id = setInterval(() => void muat(), 60_000);
		return () => clearInterval(id);
	});
</script>

{#if boleh}
	<a
		class="relative inline-flex items-center rounded px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
		href={resolveAppPath('/piutang/overdue')}
		aria-label="Notifikasi piutang: {total} item"
		title="Overdue {overdue} · mendekati JT {nearDue}"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.75"
			class="h-5 w-5"
			aria-hidden="true"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
			/>
		</svg>
		{#if total > 0}
			<span
				class="absolute -right-0.5 -top-0.5 min-w-[1.1rem] rounded-full bg-red-600 px-1 text-center text-[10px] leading-4 text-white"
			>
				{total > 99 ? '99+' : total}
			</span>
		{/if}
	</a>
{/if}
