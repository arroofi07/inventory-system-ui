<script lang="ts">
	import Field from '$lib/components/form/Field.svelte';
	import CurrencyInput from '$lib/components/form/CurrencyInput.svelte';
	import PercentInput from '$lib/components/form/PercentInput.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { formatRupiah } from '$lib/domain/format';
	import {
		PPN_PERSEN_DEFAULT,
		hitungHPP,
		hitungHPPDenganPPN,
		hitungNominalPPN,
		hitungHargaChannel,
		type MarkupTipe
	} from '$lib/domain/pricing';

	interface Props {
		harga?: string;
		disc1?: string;
		disc2?: string;
		disc3?: string;
		markupMtType?: MarkupTipe;
		markupMtAmt?: string;
		markupGtType?: MarkupTipe;
		markupGtAmt?: string;
		errors?: Record<string, string>;
		disabled?: boolean;
	}

	let {
		harga = $bindable('0.00'),
		disc1 = $bindable('0.00'),
		disc2 = $bindable('0.00'),
		disc3 = $bindable('0.00'),
		markupMtType = $bindable('percent'),
		markupMtAmt = $bindable('0.00'),
		markupGtType = $bindable('percent'),
		markupGtAmt = $bindable('0.00'),
		errors = {},
		disabled = false
	}: Props = $props();

	const hpp = $derived(hitungHPP(harga, disc1, disc2, disc3));
	const ppnNominal = $derived(hitungNominalPPN(hpp, PPN_PERSEN_DEFAULT));
	const hppPpn = $derived(hitungHPPDenganPPN(hpp, PPN_PERSEN_DEFAULT));
	const hargaMt = $derived(hitungHargaChannel(harga, markupMtAmt, markupMtType));
	const hargaGt = $derived(hitungHargaChannel(harga, markupGtAmt, markupGtType));
	const hppNolKarenaDiskon = $derived(hpp === '0.00' && harga !== '0.00' && harga !== '');
</script>

{#snippet tipeMarkup(id: string, value: MarkupTipe, label: string, onchange: (v: MarkupTipe) => void)}
	<div class="inline-flex gap-1 rounded-2xl border border-border p-0.5 text-xs" role="group" aria-label={label}>
		<Button
			type="button"
			{id}
			size="xs"
			variant={value === 'percent' ? 'default' : 'ghost'}
			{disabled}
			onclick={() => onchange('percent')}
		>
			Persen (%)
		</Button>
		<Button
			type="button"
			size="xs"
			variant={value === 'value' ? 'default' : 'ghost'}
			{disabled}
			onclick={() => onchange('value')}
		>
			Nilai (Rp)
		</Button>
	</div>
{/snippet}

<Card.Root size="sm">
	<Card.Header>
		<Card.Title>Diskon HPP berjenjang</Card.Title>
		<Card.Description>
			Tiap diskon dihitung dari hasil sebelumnya: Harga → (1−Disc1) → (1−Disc2) → (1−Disc3)
		</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-3">
		<Field label="Harga list" required forId="harga" error={errors.harga}>
			<CurrencyInput id="harga" bind:value={harga} {disabled} />
		</Field>

		<div class="grid gap-3 sm:grid-cols-3">
			<Field label="Disc HPP 1 (%)" forId="d1" error={errors.disc_hpp_1}>
				<PercentInput id="d1" class="w-full" bind:value={disc1} {disabled} />
			</Field>
			<Field label="Disc HPP 2 (%)" forId="d2" error={errors.disc_hpp_2}>
				<PercentInput id="d2" class="w-full" bind:value={disc2} {disabled} />
			</Field>
			<Field label="Disc HPP 3 (%)" forId="d3" error={errors.disc_hpp_3}>
				<PercentInput id="d3" class="w-full" bind:value={disc3} {disabled} />
			</Field>
		</div>

		<div class="space-y-1 rounded-2xl bg-primary/5 px-3 py-2 text-sm">
			<div class="flex justify-between gap-3 tabular-nums">
				<span class="text-muted-foreground">HPP setelah diskon</span>
				<span class="font-mono">{formatRupiah(hpp)}</span>
			</div>
			<div class="flex justify-between gap-3 tabular-nums">
				<span class="text-muted-foreground">PPN {PPN_PERSEN_DEFAULT}%</span>
				<span class="font-mono">{formatRupiah(ppnNominal)}</span>
			</div>
			<div class="flex justify-between gap-3 font-semibold tabular-nums">
				<span>HPP termasuk PPN</span>
				<span class="font-mono">{formatRupiah(hppPpn)}</span>
			</div>
			{#if hppNolKarenaDiskon}
				<p class="text-xs text-peringatan">
					HPP Rp 0 karena disc 100%, jadi PPN 11% juga Rp 0. Harga MT/GT tidak ditambah PPN.
				</p>
			{/if}
		</div>
	</Card.Content>
</Card.Root>

<Card.Root size="sm" class="mt-4">
	<Card.Header>
		<Card.Title>Pengaturan harga per channel</Card.Title>
		<Card.Description>Markup dihitung dari harga list, bukan dari HPP.</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="space-y-2 rounded-2xl border border-border p-3">
				<p class="text-sm font-medium">Markup Modern Trade (MT)</p>
				{@render tipeMarkup('mt-type', markupMtType, 'Jenis markup MT', (v) => {
					markupMtType = v;
				})}
				{#if markupMtType === 'value'}
					<Field label="Nilai markup" forId="mt-amt" error={errors.markup_mt_amount}>
						<CurrencyInput id="mt-amt" bind:value={markupMtAmt} {disabled} />
					</Field>
				{:else}
					<Field label="Persen (%)" forId="mt-amt" error={errors.markup_mt_amount}>
						<PercentInput id="mt-amt" class="w-full" bind:value={markupMtAmt} max={999} {disabled} />
					</Field>
				{/if}
				<div class="rounded-2xl bg-primary/5 px-3 py-2">
					<p class="text-xs text-muted-foreground">Harga MT (hasil)</p>
					<p class="font-mono text-sm font-semibold tabular-nums">{formatRupiah(hargaMt)}</p>
				</div>
				<p class="text-xs text-muted-foreground">Untuk pelanggan Modern Trade & Modern Trade Independent.</p>
			</div>

			<div class="space-y-2 rounded-2xl border border-border p-3">
				<p class="text-sm font-medium">Markup General Trade (GT)</p>
				{@render tipeMarkup('gt-type', markupGtType, 'Jenis markup GT', (v) => {
					markupGtType = v;
				})}
				{#if markupGtType === 'value'}
					<Field label="Nilai markup" forId="gt-amt" error={errors.markup_gt_amount}>
						<CurrencyInput id="gt-amt" bind:value={markupGtAmt} {disabled} />
					</Field>
				{:else}
					<Field label="Persen (%)" forId="gt-amt" error={errors.markup_gt_amount}>
						<PercentInput id="gt-amt" class="w-full" bind:value={markupGtAmt} max={999} {disabled} />
					</Field>
				{/if}
				<div class="rounded-2xl bg-primary/5 px-3 py-2">
					<p class="text-xs text-muted-foreground">Harga GT (hasil)</p>
					<p class="font-mono text-sm font-semibold tabular-nums">{formatRupiah(hargaGt)}</p>
				</div>
				<p class="text-xs text-muted-foreground">Untuk General Trade, Sub Agen, dan channel lainnya.</p>
			</div>
		</div>
	</Card.Content>
</Card.Root>
