export type ToastTone = 'info' | 'sukses' | 'peringatan' | 'bahaya';

export type ToastItem = {
	id: number;
	message: string;
	tone: ToastTone;
};

let items = $state<ToastItem[]>([]);
let seq = 0;
const timers = new Map<number, ReturnType<typeof setTimeout>>();

export function getToasts(): ToastItem[] {
	return items;
}

/** @deprecated gunakan getToasts — tetap ada untuk kompatibilitas singkat. */
export function getToast(): string | null {
	return items[0]?.message ?? null;
}

export function showToast(message: string, tone: ToastTone = 'info', durationMs = 4000) {
	const id = ++seq;
	items = [...items, { id, message, tone }];
	if (durationMs > 0) {
		const t = setTimeout(() => dismissToast(id), durationMs);
		timers.set(id, t);
	}
	return id;
}

export function dismissToast(id: number) {
	const t = timers.get(id);
	if (t) {
		clearTimeout(t);
		timers.delete(id);
	}
	items = items.filter((x) => x.id !== id);
}

export function clearToast() {
	for (const t of timers.values()) clearTimeout(t);
	timers.clear();
	items = [];
}
