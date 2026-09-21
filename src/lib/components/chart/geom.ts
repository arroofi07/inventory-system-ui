/** Geometri chart murni — diuji tanpa mount komponen. */

export function nilaiChart(v: number | string): number {
	const n = typeof v === 'number' ? v : Number(v);
	return Number.isFinite(n) ? n : 0;
}

export function maxChart(values: Array<number | string>, lantai = 1): number {
	if (values.length === 0) return lantai;
	return Math.max(lantai, ...values.map(nilaiChart));
}

export function persentaseBatang(
	nilai: number | string,
	max: number,
	minPersen = 2
): number {
	const n = Math.max(0, nilaiChart(nilai));
	const m = max > 0 ? max : 1;
	if (n === 0) return 0;
	return Math.max(minPersen, Math.round((n / m) * 100));
}

export type TitikGaris = { x: number; y: number };

export function titikGaris(
	values: Array<number | string>,
	opts?: { width?: number; height?: number; pad?: number }
): TitikGaris[] {
	const width = opts?.width ?? 100;
	const height = opts?.height ?? 40;
	const pad = opts?.pad ?? 2;
	const vals = values.map(nilaiChart);
	if (vals.length === 0) return [];
	const max = maxChart(vals);
	const innerH = height - pad * 2;
	return vals.map((v, i) => {
		const x = vals.length === 1 ? width / 2 : (i / (vals.length - 1)) * width;
		const y = height - pad - Math.min(1, v / max) * innerH;
		return { x, y };
	});
}

export function polylinePoints(points: TitikGaris[]): string {
	return points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

export function areaPath(points: TitikGaris[], height: number): string {
	if (points.length === 0) return '';
	const first = points[0];
	const last = points[points.length - 1];
	const garis = points.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
	return `M ${first.x.toFixed(1)} ${height.toFixed(1)} ${garis} L ${last.x.toFixed(1)} ${height.toFixed(1)} Z`;
}
