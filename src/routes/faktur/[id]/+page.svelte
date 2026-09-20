<script lang="ts">
	import { page } from '$app/state';
	import FakturDokumen from '$lib/components/faktur/FakturDokumen.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ambilFaktur, unduhFakturPdf, type Faktur, type FakturItem } from '$lib/api/faktur';
	import { ApiError } from '$lib/api/http';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { resolveAppPath } from '$lib/nav';

	const id = $derived(Number(page.params.id));

	let faktur = $state<Faktur | null>(null);
	let terkunci = $state(false);
	let pesan = $state<string | null>(null);
	let loading = $state(true);
	let mengunduh = $state(false);

	const chunks = $derived.by(() => {
		if (!faktur || faktur.layout !== 'paginated') return [] as FakturItem[][];
		const per = 30;
		const out: FakturItem[][] = [];
		for (let i = 0; i < faktur.items.length; i += per) {
			out.push(faktur.items.slice(i, i + per));
		}
		return out;
	});

	function subtotalChunk(items: FakturItem[]): string {
		let sum = 0;
		for (const it of items) {
			sum += Number.parseFloat(it.total_final_baris) || 0;
		}
		return sum.toFixed(2);
	}

	async function muat() {
		loading = true;
		terkunci = false;
		pesan = null;
		faktur = null;
		try {
			const res = await ambilFaktur(id);
			faktur = res.data;
			if (page.url.searchParams.get('print') === '1') {
				requestAnimationFrame(() => window.print());
			}
		} catch (e) {
			if (e instanceof ApiError && e.body.code === 'FAKTUR_TERKUNCI') {
				terkunci = true;
			} else {
				pesan = e instanceof ApiError ? e.body.message : 'Gagal memuat faktur';
			}
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		void id;
		void auth.siap;
		void auth.terautentikasi;
		if (!auth.siap) return;
		if (!auth.terautentikasi) {
			loading = false;
			pesan = 'Sesi tidak valid. Silakan login ulang.';
			return;
		}
		if (Number.isFinite(id) && id > 0) {
			void muat();
		}
	});

	async function unduhPdf() {
		if (mengunduh) return;
		mengunduh = true;
		try {
			await unduhFakturPdf(id, faktur?.no_transaksi);
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal mengunduh PDF', 'bahaya');
		} finally {
			mengunduh = false;
		}
	}
</script>

<svelte:head>
	<title>
		{faktur?.no_transaksi ? `Faktur ${faktur.no_transaksi}` : 'Faktur'}
	</title>
</svelte:head>

{#if !auth.siap || loading}
	<p class="p-6 text-sm text-muted">Memuat faktur…</p>
{:else if terkunci}
	<div class="mx-auto max-w-lg space-y-3 p-6">
		<h1 class="font-display text-2xl text-ink">Faktur terkunci</h1>
		<p class="text-sm text-muted">
			Faktur sudah pernah dicetak. Hanya super admin yang dapat mencetak ulang.
		</p>
		<div class="flex flex-wrap items-center gap-2">
			<Button variant="link" class="h-auto p-0" href={resolveAppPath(`/transaksi/${id}`)}>
				Kembali ke transaksi
			</Button>
			{#if auth.punyaIzin('faktur.cetak_ulang')}
				<Button
					variant="link"
					class="h-auto p-0"
					type="button"
					onclick={() => void unduhPdf()}
					disabled={mengunduh}
				>
					Unduh PDF (cetak ulang)
				</Button>
			{/if}
		</div>
	</div>
{:else if pesan}
	<div class="mx-auto max-w-lg space-y-3 p-6">
		<h1 class="font-display text-2xl text-ink">Tidak dapat mencetak</h1>
		<p class="text-sm text-bahaya">{pesan}</p>
		<div class="flex flex-wrap items-center gap-2">
			<Button variant="link" class="h-auto p-0" href={resolveAppPath(`/transaksi/${id}`)}>
				Kembali
			</Button>
			<Button variant="link" class="h-auto p-0" href={resolveAppPath('/login')}>Login</Button>
		</div>
	</div>
{:else if faktur}
	<div
		class="tanpa-cetak flex flex-wrap items-center gap-2 border-b border-primary/20 bg-primary/5 px-4 py-3"
	>
		<Button type="button" onclick={() => window.print()}>Cetak</Button>
		<Button variant="outline" type="button" onclick={() => void unduhPdf()} disabled={mengunduh}>
			{mengunduh ? 'Mengunduh…' : 'Unduh PDF'}
		</Button>
		<Button variant="outline" href={resolveAppPath(`/transaksi/${id}`)}>Kembali</Button>
		{#if faktur.cetak_ulang}
			<span
				class="ml-auto rounded border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm text-amber-900"
			>
				Faktur ini sudah pernah dicetak sebelumnya
			</span>
		{:else}
			<span class="ml-auto text-xs text-primary/70">
				Peringatan: membuka halaman ini mengunci dokumen (sekali, kecuali super admin).
			</span>
		{/if}
	</div>

	<div class="space-y-6 p-4 print:p-0">
		{#if faktur.layout === 'paginated'}
			{#each chunks as chunk, i (i)}
				{@const terakhir = i === chunks.length - 1}
				<FakturDokumen
					{faktur}
					items={chunk}
					halamanKe={i + 1}
					totalHalaman={chunks.length}
					subtotalHalaman={terakhir ? null : subtotalChunk(chunk)}
					tampilRingkasan={terakhir}
					tampilTandaTangan={terakhir}
				/>
			{/each}
		{:else}
			<FakturDokumen {faktur} />
		{/if}
	</div>
{/if}
