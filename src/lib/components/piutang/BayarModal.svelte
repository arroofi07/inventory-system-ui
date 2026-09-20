<script lang="ts">
	import Field from '$lib/components/form/Field.svelte';
	import CurrencyInput from '$lib/components/form/CurrencyInput.svelte';
	import Modal from '$lib/components/feedback/Modal.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { catatPembayaran, type HasilPembayaran, type PiutangItem } from '$lib/api/piutang';
	import { formatRupiah } from '$lib/domain/format';
	import { showToast } from '$lib/stores/toast.svelte';
	import { ApiError } from '$lib/api/http';

	interface Props {
		open?: boolean;
		row: PiutangItem | null;
		onsukses?: (hasil: HasilPembayaran) => void;
	}

	let { open = $bindable(false), row, onsukses }: Props = $props();

	let nominal = $state('0.00');
	let tanggal = $state('');
	let metode = $state('');
	let keterangan = $state('');
	let menyimpan = $state(false);
	let hasil = $state<HasilPembayaran | null>(null);
	let errorMsg = $state('');

	$effect(() => {
		if (open && row) {
			nominal = '0.00';
			tanggal = new Date().toISOString().slice(0, 10);
			metode = '';
			keterangan = '';
			hasil = null;
			errorMsg = '';
		}
	});

	async function kirim() {
		if (!row || menyimpan) return;
		errorMsg = '';
		menyimpan = true;
		try {
			const body: {
				nominal_pembayaran: string;
				tanggal_pembayaran?: string;
				metode_pembayaran?: string;
				keterangan?: string;
			} = { nominal_pembayaran: nominal };
			if (tanggal.trim()) body.tanggal_pembayaran = tanggal.trim();
			if (metode.trim()) body.metode_pembayaran = metode.trim();
			if (keterangan.trim()) body.keterangan = keterangan.trim();
			const key =
				typeof crypto !== 'undefined' && 'randomUUID' in crypto
					? crypto.randomUUID()
					: `pay-${row.transaksi_id}-${Date.now()}`;
			const res = await catatPembayaran(row.transaksi_id, body, key);
			hasil = res.data;
			showToast('Pembayaran dicatat', 'sukses');
			onsukses?.(res.data);
		} catch (e) {
			if (e instanceof ApiError) {
				errorMsg = e.body.message;
				if (e.body.code === 'KELEBIHAN_BAYAR') {
					errorMsg = 'Nominal melebihi sisa hutang / total akhir (KELEBIHAN_BAYAR).';
				} else if (e.body.code === 'STATUS_TIDAK_VALID') {
					errorMsg = 'Transaksi belum approved atau status tidak valid.';
				}
			} else {
				errorMsg = 'Gagal mencatat pembayaran';
			}
			showToast(errorMsg, 'bahaya');
		} finally {
			menyimpan = false;
		}
	}
</script>

<Modal bind:open title="Catat pembayaran">
	{#if row}
		<div class="space-y-3 text-sm">
			<p class="text-muted-foreground">
				{row.kode_pelanggan} — {row.nama_pelanggan}
				{#if row.no_transaksi}
					· No {row.no_transaksi}
				{:else}
					· #{row.transaksi_id}
				{/if}
			</p>
			<div class="border-primary/20 bg-primary/5 grid grid-cols-2 gap-2 rounded-2xl border p-2 text-xs">
				<div>
					<p class="text-primary/70">Total akhir</p>
					<p class="font-medium">{formatRupiah(row.total_akhir)}</p>
				</div>
				<div>
					<p class="text-primary/70">Sisa hutang</p>
					<p class="font-medium">{formatRupiah(hasil?.sisa_hutang ?? row.sisa_hutang)}</p>
				</div>
				<div>
					<p class="text-primary/70">Sudah dibayar</p>
					<p class="font-medium">{formatRupiah(hasil?.jumlah_dibayar ?? row.jumlah_dibayar)}</p>
				</div>
				<div>
					<p class="text-primary/70">Status (server)</p>
					<p class="font-medium">{hasil?.status_pembayaran ?? row.status_pembayaran}</p>
				</div>
			</div>
			<p class="text-xs text-muted-foreground">
				Status lunas/hutang/sebagian ditentukan server dari nominal — tidak dipilih manual.
			</p>

			{#if hasil}
				<p class="rounded-2xl border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-emerald-900">
					Tercatat. Status: <strong>{hasil.status_pembayaran}</strong> · dibayar
					{formatRupiah(hasil.jumlah_dibayar)} · sisa {formatRupiah(hasil.sisa_hutang)}
				</p>
			{:else}
				<Field label="Nominal pembayaran diterima" forId="bayar-nom">
					<CurrencyInput id="bayar-nom" bind:value={nominal} />
				</Field>
				<Field label="Tanggal pembayaran" forId="bayar-tgl">
					<Input id="bayar-tgl" type="date" bind:value={tanggal} />
				</Field>
				<Field label="Metode" forId="bayar-met">
					<Input
						id="bayar-met"
						placeholder="Transfer / tunai…"
						bind:value={metode}
					/>
				</Field>
				<Field label="Keterangan" forId="bayar-ket">
					<Textarea id="bayar-ket" rows={2} bind:value={keterangan} />
				</Field>
				{#if errorMsg}
					<p class="text-sm text-bahaya">{errorMsg}</p>
				{/if}
			{/if}
		</div>
	{/if}

	{#snippet footer()}
		<Button type="button" variant="outline" onclick={() => (open = false)}>
			{hasil ? 'Tutup' : 'Batal'}
		</Button>
		{#if !hasil}
			<Button
				type="button"
				disabled={menyimpan || !row}
				onclick={() => void kirim()}
			>
				{menyimpan ? 'Menyimpan…' : 'Simpan'}
			</Button>
		{/if}
	{/snippet}
</Modal>
