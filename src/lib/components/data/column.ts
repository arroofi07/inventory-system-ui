import type { BadgeTone } from './badge-tone';

export type ColumnDef<Row extends Record<string, unknown>> = {
	id: string;
	header: string;
	accessor?: keyof Row & string;
	align?: 'left' | 'right' | 'center';
	sortable?: boolean;
	format?: (row: Row) => string;
	/** Render sebagai Badge (status domain atau tone eksplisit). */
	badge?: (row: Row) => { label: string; status?: string; tone?: BadgeTone } | null;
	/** Sembunyikan kolom ini pada kartu mobile. */
	hideOnMobile?: boolean;
	/** Kolom monospace (kode, SKU). */
	mono?: boolean;
};
