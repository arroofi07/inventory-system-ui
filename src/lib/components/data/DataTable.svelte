<script lang="ts" generics="T extends Record<string, unknown>">
	import type { Snippet } from 'svelte';
	import Skeleton from '$lib/components/feedback/Skeleton.svelte';
	import EmptyState from '$lib/components/data/EmptyState.svelte';
	import Badge from '$lib/components/data/Badge.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { cn } from '$lib/utils.js';
	import type { ColumnDef } from './column';

	interface Props {
		columns: ColumnDef<T>[];
		rows: T[];
		loading?: boolean;
		emptyTitle?: string;
		emptyDescription?: string;
		rowKey?: (row: T, index: number) => string | number;
		onrowclick?: (row: T) => void;
		sort?: { id: string; dir: 'asc' | 'desc' } | null;
		onsort?: (id: string) => void;
		/** Kolom aksi di kanan (desktop + baris mobile). */
		actions?: Snippet<[T]>;
		actionsHeader?: string;
	}

	let {
		columns,
		rows,
		loading = false,
		emptyTitle = 'Tidak ada data',
		emptyDescription = 'Belum ada baris untuk ditampilkan.',
		rowKey = (_row, i) => i,
		onrowclick,
		sort = null,
		onsort,
		actions,
		actionsHeader = 'Aksi'
	}: Props = $props();

	function alignClass(a?: 'left' | 'right' | 'center') {
		switch (a) {
			case 'right':
				return 'text-right';
			case 'center':
				return 'text-center';
			case 'left':
			case undefined:
				return 'text-left';
			default: {
				const _exhaustive: never = a;
				return _exhaustive;
			}
		}
	}

	function cellText(col: ColumnDef<T>, row: T): string {
		if (col.format) return col.format(row);
		if (col.accessor) {
			const v = row[col.accessor];
			return v == null ? '' : String(v);
		}
		return '';
	}

	const judulCol = $derived(columns.find((c) => !c.hideOnMobile) ?? columns[0]);
	const detailCols = $derived(columns.filter((c) => c !== judulCol && !c.hideOnMobile));
	const colSpan = $derived(columns.length + (actions ? 1 : 0));
</script>

{#snippet cellContent(col: ColumnDef<T>, row: T)}
	{@const badge = col.badge?.(row)}
	{#if badge}
		<Badge label={badge.label} status={badge.status} tone={badge.tone} />
	{:else}
		<span class={cn(col.mono && 'font-mono text-xs tracking-tight', col.align === 'right' && 'tabular-nums')}>
			{cellText(col, row)}
		</span>
	{/if}
{/snippet}

<Card.Root class="border-border/80 gap-0 overflow-hidden bg-card py-0 shadow-sm">
	{#if loading}
		<div class="space-y-3 p-4 md:hidden">
			{#each Array(4) as _, i (i)}
				<Skeleton class="h-28 w-full rounded-xl" />
			{/each}
		</div>
	{:else if rows.length === 0}
		<div class="md:hidden">
			<EmptyState title={emptyTitle} description={emptyDescription} />
		</div>
	{:else}
		<ul class="divide-border/80 divide-y md:hidden">
			{#each rows as row, i (rowKey(row, i))}
				<li class="border-l-2 border-l-transparent transition-colors hover:border-l-primary hover:bg-primary/8">
					{#if onrowclick}
						<Button
							type="button"
							variant="ghost"
							class="flex h-auto w-full flex-col items-stretch gap-2 rounded-none px-4 py-3.5 text-left font-normal whitespace-normal hover:bg-transparent"
							onclick={() => onrowclick(row)}
						>
							{#if judulCol}
								<p class="text-foreground text-sm font-semibold">
									{@render cellContent(judulCol, row)}
								</p>
							{/if}
							{#each detailCols as col (col.id)}
								<div class="flex items-start justify-between gap-3 text-sm">
									<span class="text-primary/70 shrink-0 text-xs font-medium tracking-wide uppercase">
										{col.header}
									</span>
									<span class="text-foreground text-right">{@render cellContent(col, row)}</span>
								</div>
							{/each}
						</Button>
					{:else}
						<div class="flex flex-col gap-2 px-4 py-3.5">
							{#if judulCol}
								<p class="text-foreground text-sm font-semibold">
									{@render cellContent(judulCol, row)}
								</p>
							{/if}
							{#each detailCols as col (col.id)}
								<div class="flex items-start justify-between gap-3 text-sm">
									<span class="text-primary/70 shrink-0 text-xs font-medium tracking-wide uppercase">
										{col.header}
									</span>
									<span class="text-foreground text-right">{@render cellContent(col, row)}</span>
								</div>
							{/each}
						</div>
					{/if}
					{#if actions}
						<div class="border-primary/10 bg-primary/5 flex flex-wrap gap-2 border-t px-4 py-2.5">
							{@render actions(row)}
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}

	<div class="hidden md:block">
		<Table.Root class="min-w-full">
			<Table.Header>
				<Table.Row class="hover:bg-transparent border-b-0">
					{#each columns as col (col.id)}
						<Table.Head class={alignClass(col.align)}>
							{#if col.sortable && onsort}
								<Button
									type="button"
									variant="ghost"
									class="text-primary hover:bg-primary/15 -ml-2 h-8 gap-1 px-2 text-[0.7rem] font-semibold tracking-wider uppercase"
									onclick={() => onsort(col.id)}
								>
									{col.header}
									{#if sort?.id === col.id}
										<span aria-hidden="true">{sort.dir === 'asc' ? '↑' : '↓'}</span>
									{/if}
								</Button>
							{:else}
								{col.header}
							{/if}
						</Table.Head>
					{/each}
					{#if actions}
						<Table.Head class="text-right">
							{actionsHeader}
						</Table.Head>
					{/if}
				</Table.Row>
			</Table.Header>
			<Table.Body class="[&_tr:last-child]:border-0">
				{#if loading}
					{#each Array(5) as _, i (i)}
						<Table.Row class="hover:bg-transparent">
							{#each columns as col (col.id)}
								<Table.Cell class="px-4 py-3.5"><Skeleton class="h-4 w-full rounded-md" /></Table.Cell>
							{/each}
							{#if actions}
								<Table.Cell class="px-4 py-3.5"><Skeleton class="ml-auto h-4 w-20 rounded-md" /></Table.Cell>
							{/if}
						</Table.Row>
					{/each}
				{:else if rows.length === 0}
					<Table.Row class="hover:bg-transparent">
						<Table.Cell colspan={colSpan} class="whitespace-normal p-0">
							<EmptyState title={emptyTitle} description={emptyDescription} />
						</Table.Cell>
					</Table.Row>
				{:else}
					{#each rows as row, i (rowKey(row, i))}
						<Table.Row
							class={cn(
								'border-border/70 transition-colors',
								i % 2 === 1 && 'bg-primary/5',
								onrowclick && 'hover:bg-primary/8 cursor-pointer'
							)}
							onclick={() => onrowclick?.(row)}
							onkeydown={(e) => {
								if (onrowclick && (e.key === 'Enter' || e.key === ' ')) {
									e.preventDefault();
									onrowclick(row);
								}
							}}
							tabindex={onrowclick ? 0 : undefined}
							role={onrowclick ? 'button' : undefined}
						>
							{#each columns as col, ci (col.id)}
								<Table.Cell
									class={cn(
										'text-foreground px-4 py-3.5',
										alignClass(col.align),
										ci === 0 && 'font-medium'
									)}
								>
									{@render cellContent(col, row)}
								</Table.Cell>
							{/each}
							{#if actions}
								<Table.Cell
									class="px-4 py-3.5 text-right"
									onclick={(e) => e.stopPropagation()}
									onkeydown={(e) => e.stopPropagation()}
								>
									<div class="flex flex-wrap items-center justify-end gap-1">
										{@render actions(row)}
									</div>
								</Table.Cell>
							{/if}
						</Table.Row>
					{/each}
				{/if}
			</Table.Body>
		</Table.Root>
	</div>
</Card.Root>
