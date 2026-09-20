<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import type { BatchTersediaItem } from '$lib/api/barang';
	import { formatRupiah } from '$lib/domain/format';

	interface Props {
		batch: BatchTersediaItem;
		channel?: string;
		metodeAlokasi?: string;
		satuan?: string;
	}

	let { batch, channel = '', metodeAlokasi = 'FEFO', satuan = 'unit' }: Props = $props();

	const channelInfo = $derived.by(() => {
		const mt = channel.toLowerCase().includes('modern trade');
		return {
			singkat: mt ? 'MT' : 'GT',
			penuh: mt ? 'Modern Trade' : 'General Trade',
			harga: mt ? batch.harga_mt : batch.harga_gt
		};
	});

	const metodeJudul = $derived(metodeAlokasi === 'FEFO' ? 'FEFO' : metodeAlokasi || 'FEFO');
	const metodePenjelasan = $derived(
		metodeAlokasi === 'FEFO'
			? 'FEFO (First Expired First Out)'
			: metodeAlokasi === 'FIFO'
				? 'FIFO (First In First Out)'
				: metodeAlokasi
	);

	function formatExpTampilan(exp: string): string {
		const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(exp);
		return m ? `${m[3]}/${m[2]}/${m[1]}` : exp;
	}
</script>

<Card.Root size="sm" class="border-sky-200 bg-sky-50 text-foreground ring-sky-200/60">
	<Card.Header class="pb-0">
		<Card.Title class="flex items-center gap-2 text-sky-900">
			Info Batch Terpilih ({metodeJudul})
		</Card.Title>
	</Card.Header>
	<Card.Content class="space-y-3">
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			<div>
				<p class="text-xs font-medium uppercase tracking-wide text-sky-800/70">Batch</p>
				<p class="font-mono font-semibold">{batch.no_batch}</p>
			</div>
			<div>
				<p class="text-xs font-medium uppercase tracking-wide text-sky-800/70">Expiry</p>
				<p class="flex items-center gap-1 font-semibold tabular-nums">
					{formatExpTampilan(batch.exp)}
					{#if !batch.mendekati_exp}
						<span class="text-emerald-600" title="Belum mendekati exp">✓</span>
					{:else}
						<span class="text-amber-600" title="Mendekati exp">!</span>
					{/if}
				</p>
			</div>
			<div>
				<p class="text-xs font-medium uppercase tracking-wide text-sky-800/70">Stok</p>
				<p class="font-semibold tabular-nums">{batch.qty_tersedia} {satuan}</p>
			</div>
			<div>
				<p class="text-xs font-medium uppercase tracking-wide text-sky-800/70">Harga</p>
				<p class="flex flex-wrap items-center gap-2 font-semibold">
					{formatRupiah(channelInfo.harga)}
					<Badge
						variant="secondary"
						class={channelInfo.singkat === 'MT'
							? 'bg-violet-100 text-violet-800'
							: 'bg-amber-100 text-amber-800'}
					>
						{channelInfo.singkat} ({channelInfo.penuh})
					</Badge>
				</p>
			</div>
		</div>

		<p class="border-t border-sky-200/80 pt-2 text-xs text-sky-900/80">
			MT: {formatRupiah(batch.harga_mt)} · GT: {formatRupiah(batch.harga_gt)}
		</p>

		<p class="text-xs text-sky-800/90">
			Batch ini dipilih otomatis berdasarkan {metodePenjelasan}
		</p>
	</Card.Content>
</Card.Root>
