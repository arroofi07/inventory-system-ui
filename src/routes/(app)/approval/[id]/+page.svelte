<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import Field from '$lib/components/form/Field.svelte';
	import Modal from '$lib/components/feedback/Modal.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import {
		detailTransaksi,
		ketersediaanStok,
		approveTransaksi,
		rejectTransaksi,
		type Transaksi,
		type KetersediaanStok,
		type HasilApproval
	} from '$lib/api/transaksi';
	import { formatRupiah } from '$lib/domain/format';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { pergiKe } from '$lib/nav';
	import { ApiError } from '$lib/api/http';
	import { unduhFakturPdf } from '$lib/api/faktur';

	const id = $derived(Number(page.params.id));

	let trx = $state<Transaksi | null>(null);
	let ket = $state<KetersediaanStok | null>(null);
	let loading = $state(true);
	let menyimpan = $state(false);
	let hasilApprove = $state<HasilApproval | null>(null);

	let rejectOpen = $state(false);
	let approveOpen = $state(false);
	let catatanReject = $state('');
	let catatanApprove = $state('');
	let mengunduhPdf = $state(false);

	const bisaAksi = $derived(auth.punyaIzin('approval.lakukan'));
	const pending = $derived(trx?.status_approval === 'pending');
	const tampilAksi = $derived(Boolean(trx && bisaAksi && pending && !hasilApprove));

	async function muat() {
		loading = true;
		hasilApprove = null;
		try {
			const [d, k] = await Promise.all([detailTransaksi(id), ketersediaanStok(id)]);
			trx = d.data;
			ket = k.data;
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal memuat', 'bahaya');
			trx = null;
			ket = null;
			if (e instanceof ApiError && e.status === 404) {
				await pergiKe('/approval');
			}
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		void id;
		if (Number.isFinite(id) && id > 0) {
			void muat();
		}
	});

	async function konfirmasiApprove() {
		if (!tampilAksi || menyimpan) return;
		menyimpan = true;
		try {
			const body: { approval_notes?: string } = {};
			const notes = catatanApprove.trim();
			if (notes) body.approval_notes = notes;
			const res = await approveTransaksi(id, body);
			hasilApprove = res.data;
			approveOpen = false;
			catatanApprove = '';
			if (trx) {
				trx = {
					...trx,
					status_approval: res.data.status_approval,
					no_transaksi: res.data.no_transaksi
				};
			}
			showToast(`Disetujui · ${res.data.no_transaksi}`, 'sukses');
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal menyetujui', 'bahaya');
		} finally {
			menyimpan = false;
		}
	}

	async function konfirmasiReject() {
		const notes = catatanReject.trim();
		if (!tampilAksi || menyimpan || !notes) {
			if (!notes) showToast('Catatan penolakan wajib diisi', 'bahaya');
			return;
		}
		menyimpan = true;
		try {
			const res = await rejectTransaksi(id, { approval_notes: notes });
			trx = res.data;
			rejectOpen = false;
			catatanReject = '';
			showToast('Transaksi ditolak', 'sukses');
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal menolak', 'bahaya');
		} finally {
			menyimpan = false;
		}
	}

	async function unduhPdf() {
		if (mengunduhPdf) return;
		mengunduhPdf = true;
		try {
			await unduhFakturPdf(id, hasilApprove?.no_transaksi ?? trx?.no_transaksi);
		} catch (e) {
			showToast(e instanceof ApiError ? e.body.message : 'Gagal mengunduh PDF', 'bahaya');
		} finally {
			mengunduhPdf = false;
		}
	}
</script>

<div class="space-y-4">
	<Button
		variant="link"
		class="h-auto p-0"
		href={resolve(...(['/approval', {}] as unknown as Parameters<typeof resolve>))}
	>
		← Antrian persetujuan
	</Button>

	{#if loading}
		<p class="text-sm text-primary/70">Memuat…</p>
	{:else if !trx}
		<p class="text-sm text-primary/70">Transaksi tidak ditemukan.</p>
	{:else}
		{#if hasilApprove}
			<div
				class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900"
				role="status"
			>
				<p class="text-sm font-medium">Transaksi disetujui</p>
				<p class="font-display text-2xl tracking-wide">{hasilApprove.no_transaksi}</p>
				{#if auth.punyaIzin('faktur.cetak')}
					<p class="mt-2 flex flex-wrap items-center gap-2 text-sm">
						<Button
							variant="link"
							class="h-auto p-0 font-medium"
							href={resolve(
								...([`/faktur/${id}`, {}] as unknown as Parameters<typeof resolve>)
							)}
							target="_blank"
							rel="noopener"
						>
							Cetak faktur
						</Button>
						<Button
							variant="link"
							class="h-auto p-0 font-medium"
							onclick={() => void unduhPdf()}
							disabled={mengunduhPdf}
						>
							{mengunduhPdf ? 'Mengunduh…' : 'Unduh PDF'}
						</Button>
						<span class="text-emerald-800/80"> — hanya sekali (kecuali super admin).</span>
					</p>
				{/if}
			</div>
		{/if}

		<header class="flex flex-wrap items-start justify-between gap-3">
			<div>
				<h1 class="font-display text-2xl text-ink">
					Persetujuan #{trx.id}
					{#if trx.no_transaksi}
						<span class="text-lg text-muted">· {trx.no_transaksi}</span>
					{/if}
				</h1>
				<p class="text-sm text-muted">
					{trx.tanggal} · {trx.kode_pelanggan} — {trx.nama_pelanggan} · {trx.channel_outlet}
				</p>
				{#if trx.sales?.name}
					<p class="text-sm text-muted">Sales: {trx.sales.name}</p>
				{/if}
			</div>
			<div class="text-right text-sm">
				<p>
					<span class="rounded bg-primary/10 px-2 py-0.5">{trx.status_approval}</span>
					<span class="ml-1 rounded bg-primary/10 px-2 py-0.5">{trx.status_pembayaran}</span>
				</p>
				<p class="mt-1 font-semibold">{formatRupiah(trx.total_akhir)}</p>
				{#if trx.status_approval === 'approved' && auth.punyaIzin('faktur.cetak')}
					<p class="mt-2 flex flex-wrap justify-end gap-2 text-sm">
						<Button
							variant="link"
							class="h-auto p-0"
							href={resolve(
								...([`/faktur/${id}`, {}] as unknown as Parameters<typeof resolve>)
							)}
							target="_blank"
							rel="noopener"
						>
							Cetak faktur
						</Button>
						<Button
							variant="link"
							class="h-auto p-0"
							onclick={() => void unduhPdf()}
							disabled={mengunduhPdf}
						>
							{mengunduhPdf ? 'Mengunduh…' : 'Unduh PDF'}
						</Button>
					</p>
				{/if}
				{#if ket}
					<p class="mt-1">
						{#if ket.semua_stok_cukup}
							<span class="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800"
								>Stok cukup</span
							>
						{:else}
							<span class="rounded bg-red-100 px-2 py-0.5 text-xs text-red-800">Stok kurang</span>
						{/if}
					</p>
				{/if}
			</div>
		</header>

		<section class="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
			<div>
				<p class="text-primary/70">Area</p>
				<p>{trx.area}</p>
			</div>
			<div>
				<p class="text-primary/70">Alamat</p>
				<p>{trx.alamat ?? '—'}</p>
			</div>
			<div>
				<p class="text-primary/70">DPP / PPN</p>
				<p>{formatRupiah(trx.total)} + {formatRupiah(trx.ppn_nominal)}</p>
			</div>
			<div>
				<p class="text-primary/70">Qty ditagih / keluar</p>
				<p>{trx.total_qty_ditagih ?? '—'} / {trx.total_qty_keluar ?? '—'}</p>
			</div>
		</section>

		<div class="overflow-hidden rounded-[var(--radius-card)] border border-primary/20 bg-white">
			<Table.Root>
				<Table.Header>
					<Table.Row class="hover:bg-transparent">
						<Table.Head class="px-3 py-2">Item</Table.Head>
						<Table.Head class="px-3 py-2">Jumlah</Table.Head>
						<Table.Head class="px-3 py-2">Qty keluar</Table.Head>
						<Table.Head class="px-3 py-2">Harga</Table.Head>
						<Table.Head class="px-3 py-2">Setelah disc</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each trx.items ?? [] as it (it.id ?? it.kode_item + String(it.urutan))}
						<Table.Row>
							<Table.Cell class="px-3 py-2">
								<div class="font-medium">{it.nama_item}</div>
								<div class="text-xs text-primary/70">{it.kode_item}</div>
							</Table.Cell>
							<Table.Cell class="px-3 py-2">{it.jumlah}</Table.Cell>
							<Table.Cell class="px-3 py-2">{it.total_qty_keluar}</Table.Cell>
							<Table.Cell class="px-3 py-2">{formatRupiah(it.harga)}</Table.Cell>
							<Table.Cell class="px-3 py-2">{formatRupiah(it.total_after_disc ?? '0')}</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>

		<section class="space-y-2">
			<h2 class="font-display text-lg text-ink">Kecukupan stok</h2>
			{#if !ket || ket.sku.length === 0}
				<p class="text-sm text-muted">Tidak ada data ketersediaan.</p>
			{:else}
				<div class="overflow-hidden rounded-[var(--radius-card)] border border-primary/20 bg-white">
					<Table.Root>
						<Table.Header>
							<Table.Row class="hover:bg-transparent">
								<Table.Head class="px-3 py-2">SKU</Table.Head>
								<Table.Head class="px-3 py-2">Diminta</Table.Head>
								<Table.Head class="px-3 py-2">Tersedia</Table.Head>
								<Table.Head class="px-3 py-2">Status</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each ket.sku as s (s.kode_item)}
								<Table.Row
									class={s.stok_cukup ? 'bg-emerald-50/60' : 'bg-red-50/70'}
								>
									<Table.Cell class="px-3 py-2">
										<div class="font-medium">{s.nama_item}</div>
										<div class="text-xs text-primary/70">{s.kode_item}</div>
									</Table.Cell>
									<Table.Cell class="px-3 py-2">{s.diminta}</Table.Cell>
									<Table.Cell class="px-3 py-2">{s.tersedia}</Table.Cell>
									<Table.Cell class="px-3 py-2">
										{#if s.stok_cukup}
											<span class="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800"
												>Cukup</span
											>
										{:else}
											<span class="rounded bg-red-100 px-2 py-0.5 text-xs text-red-800"
												>Kurang</span
											>
										{/if}
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			{/if}
		</section>

		<section class="space-y-2">
			<h2 class="font-display text-lg text-ink">Transaksi bersaing</h2>
			{#if !ket || ket.bersaing.length === 0}
				<p class="text-sm text-muted">Tidak ada pending lain yang memakai SKU yang sama.</p>
			{:else}
				<ul class="divide-y divide-primary/10 rounded-lg border border-primary/20 bg-white">
					{#each ket.bersaing as b (b.id)}
						<li class="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
							<div>
								<Button
									variant="link"
									class="h-auto p-0 font-medium"
									href={resolve(
										...([`/approval/${b.id}`, {}] as unknown as Parameters<typeof resolve>)
									)}
								>
									#{b.id}
								</Button>
								<span class="text-muted">
									· {b.tanggal} · {b.kode_pelanggan} — {b.nama_pelanggan}
								</span>
								{#if b.kode_items?.length}
									<div class="text-xs text-primary/70">{b.kode_items.join(', ')}</div>
								{/if}
							</div>
							<span class="font-medium tabular-nums">{formatRupiah(b.total_akhir)}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		{#if tampilAksi}
			<div class="flex flex-wrap gap-2">
				<Button disabled={menyimpan} onclick={() => (approveOpen = true)}>Setujui</Button>
				<Button
					variant="destructive"
					disabled={menyimpan}
					onclick={() => (rejectOpen = true)}
				>
					Tolak
				</Button>
			</div>
		{:else if bisaAksi === false && pending}
			<p class="text-sm text-muted">
				Anda dapat melihat antrian ini, tetapi tidak dapat menyetujui atau menolak.
			</p>
		{/if}
	{/if}
</div>

<Modal bind:open={approveOpen} title="Konfirmasi persetujuan">
	<p class="text-sm text-muted">
		Stok akan dialokasikan sekarang. Nomor transaksi diterbitkan bila berhasil.
	</p>
	<div class="mt-3">
		<Field label="Catatan (opsional)" forId="appr-notes">
			<Textarea id="appr-notes" rows={3} class="w-full" bind:value={catatanApprove} />
		</Field>
	</div>
	{#snippet footer()}
		<div class="flex justify-end gap-2">
			<Button variant="outline" onclick={() => (approveOpen = false)}>Batal</Button>
			<Button disabled={menyimpan} onclick={() => void konfirmasiApprove()}>
				{menyimpan ? 'Memproses…' : 'Setujui'}
			</Button>
		</div>
	{/snippet}
</Modal>

<Modal bind:open={rejectOpen} title="Tolak transaksi">
	<p class="text-sm text-muted">Catatan penolakan wajib diisi.</p>
	<div class="mt-3">
		<Field label="Catatan" required forId="rej-notes">
			<Textarea id="rej-notes" rows={3} class="w-full" bind:value={catatanReject} />
		</Field>
	</div>
	{#snippet footer()}
		<div class="flex justify-end gap-2">
			<Button variant="outline" onclick={() => (rejectOpen = false)}>Batal</Button>
			<Button
				variant="destructive"
				disabled={menyimpan || !catatanReject.trim()}
				onclick={() => void konfirmasiReject()}
			>
				{menyimpan ? 'Memproses…' : 'Tolak'}
			</Button>
		</div>
	{/snippet}
</Modal>
