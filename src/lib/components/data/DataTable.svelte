<script lang="ts" generics="T extends Record<string, unknown>">
	import Skeleton from '$lib/components/feedback/Skeleton.svelte';
	import EmptyState from '$lib/components/data/EmptyState.svelte';
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
		onsort
	}: Props = $props();

	function alignClass(a?: 'left' | 'right' | 'center') {
		switch (a) {
			case 'right':
				return 'text-right';
			case 'center':
				return 'text-center';
			default:
				return 'text-left';
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
</script>

<div class="overflow-hidden rounded-[var(--radius-card)] border border-slate-200 bg-white">
	<div class="overflow-x-auto">
		<table class="min-w-full text-sm">
			<thead class="bg-surface text-left text-xs font-semibold uppercase tracking-wide text-muted">
				<tr>
					{#each columns as col (col.id)}
						<th class="px-3 py-2.5 {alignClass(col.align)}">
							{#if col.sortable && onsort}
								<button
									type="button"
									class="inline-flex items-center gap-1 hover:text-ink"
									onclick={() => onsort(col.id)}
								>
									{col.header}
									{#if sort?.id === col.id}
										<span aria-hidden="true">{sort.dir === 'asc' ? '↑' : '↓'}</span>
									{/if}
								</button>
							{:else}
								{col.header}
							{/if}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody class="divide-y divide-slate-100">
				{#if loading}
					{#each Array(5) as _, i (i)}
						<tr>
							{#each columns as col (col.id)}
								<td class="px-3 py-3"><Skeleton class="h-4 w-full" /></td>
							{/each}
						</tr>
					{/each}
				{:else if rows.length === 0}
					<tr>
						<td colspan={columns.length} class="p-0">
							<EmptyState title={emptyTitle} description={emptyDescription} />
						</td>
					</tr>
				{:else}
					{#each rows as row, i (rowKey(row, i))}
						<tr
							class={onrowclick ? 'cursor-pointer hover:bg-brand-50/60' : 'hover:bg-slate-50/80'}
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
							{#each columns as col (col.id)}
								<td class="px-3 py-2.5 text-ink {alignClass(col.align)}">{cellText(col, row)}</td>
							{/each}
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
