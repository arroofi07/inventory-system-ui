<script lang="ts">
	import { page } from '$app/state';
	import PelangganForm from '$lib/components/pelanggan/PelangganForm.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { detailPelanggan, ubahPelanggan } from '$lib/api/pelanggan';
	import { ApiError } from '$lib/api/http';
	import { auth } from '$lib/stores/auth.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { pergiKe, resolveAppPath } from '$lib/nav';

	let loading = $state(true);
	let errors = $state<Record<string, string>>({});
	let punyaTransaksi = $state(false);
	let kodePelanggan = $state('');
	let namaPelanggan = $state('');
	let tglRegistrasi = $state('');
	let phone = $state('');
	let npwpNik = $state('');
	let namaPemilikNpwpNik = $state('');
	let alamatNpwpNik = $state('');
	let territory = $state('');
	let distrik = $state('');
	let alamatToko = $state('');
	let rtRw = $state('');
	let provinsi = $state('');
	let kabupaten = $state('');
	let kecamatan = $state('');
	let kelurahan = $state('');
	let kodePos = $state('');
	let channelOutlet = $state('General Trade');
	let alamatPengantaran = $state('');
	let jenisBangunan = $state('');
	let statusBangunan = $state('');
	let nominalPengambilanPertama = $state('0');
	let estimasiBatasKredit = $state('0');

	const id = $derived(Number(page.params.id));

	$effect(() => {
		if (!auth.punyaIzin('pelanggan.ubah')) {
			showToast('Tidak berwenang mengubah pelanggan', 'bahaya');
			void pergiKe('/pelanggan');
			return;
		}
		const currentId = id;
		if (!Number.isFinite(currentId) || currentId <= 0) return;
		loading = true;
		void detailPelanggan(currentId)
			.then((res) => {
				const p = res.data;
				punyaTransaksi = Boolean(p.punya_transaksi);
				kodePelanggan = p.kode_pelanggan;
				namaPelanggan = p.nama_pelanggan;
				tglRegistrasi = p.tgl_registrasi;
				phone = p.phone;
				npwpNik = p.npwp_nik ?? '';
				namaPemilikNpwpNik = p.nama_pemilik_npwp_nik ?? '';
				alamatNpwpNik = p.alamat_npwp_nik ?? '';
				territory = p.territory;
				distrik = p.distrik;
				alamatToko = p.alamat_toko;
				rtRw = p.rt_rw ?? '';
				provinsi = p.provinsi;
				kabupaten = p.kabupaten;
				kecamatan = p.kecamatan;
				kelurahan = p.kelurahan;
				kodePos = p.kode_pos ?? '';
				channelOutlet = p.channel_outlet;
				alamatPengantaran = p.alamat_pengantaran_barang ?? '';
				jenisBangunan = p.jenis_bangunan ?? '';
				statusBangunan = p.status_bangunan ?? '';
				nominalPengambilanPertama = p.nominal_pengambilan_pertama;
				estimasiBatasKredit = p.estimasi_batas_kredit;
			})
			.catch((e) => {
				showToast(e instanceof ApiError ? e.body.message : 'Gagal memuat', 'bahaya');
				void pergiKe('/pelanggan');
			})
			.finally(() => {
				loading = false;
			});
	});
</script>

<div class="space-y-4">
	<Button variant="link" class="h-auto p-0" href={resolveAppPath(`/pelanggan/${id}`)}>
		← Kembali ke detail
	</Button>
	<header>
		<h1 class="font-display text-2xl text-ink">Ubah pelanggan</h1>
		<p class="text-sm text-muted">Hanya Super Admin.</p>
	</header>

	{#if loading}
		<p class="text-sm text-muted">Memuat…</p>
	{:else}
		<Card.Root class="gap-0 border border-primary/20 bg-white p-4 shadow-none ring-0">
			<Card.Content class="p-0">
				<PelangganForm
					mode="ubah"
					bind:kodePelanggan
					bind:namaPelanggan
					bind:tglRegistrasi
					bind:phone
					bind:npwpNik
					bind:namaPemilikNpwpNik
					bind:alamatNpwpNik
					bind:territory
					bind:distrik
					bind:alamatToko
					bind:rtRw
					bind:provinsi
					bind:kabupaten
					bind:kecamatan
					bind:kelurahan
					bind:kodePos
					bind:channelOutlet
					bind:alamatPengantaran
					bind:jenisBangunan
					bind:statusBangunan
					bind:nominalPengambilanPertama
					bind:estimasiBatasKredit
					kodeTerkunci={punyaTransaksi}
					{errors}
					onsubmit={async (payload) => {
						errors = {};
						try {
							const body = { ...payload };
							if (punyaTransaksi) {
								delete (body as { kode_pelanggan?: string }).kode_pelanggan;
							}
							const res = await ubahPelanggan(id, body);
							showToast('Perubahan disimpan', 'sukses');
							await pergiKe(`/pelanggan/${res.data.id}`);
						} catch (e) {
							if (e instanceof ApiError) {
								if (e.body.details?.length) {
									const next: Record<string, string> = {};
									for (const d of e.body.details) next[d.field] = d.message;
									errors = next;
								}
								showToast(e.body.message, 'bahaya');
								return;
							}
							showToast('Gagal menyimpan', 'bahaya');
						}
					}}
				/>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
