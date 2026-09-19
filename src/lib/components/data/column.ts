export type ColumnDef<Row extends Record<string, unknown>> = {
	id: string;
	header: string;
	accessor?: keyof Row & string;
	align?: 'left' | 'right' | 'center';
	sortable?: boolean;
	format?: (row: Row) => string;
};
