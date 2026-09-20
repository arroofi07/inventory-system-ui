import { toast } from 'svelte-sonner';

export type ToastTone = 'info' | 'sukses' | 'peringatan' | 'bahaya';

/** @deprecated daftar toast kini dikelola svelte-sonner. */
export type ToastItem = {
	id: string | number;
	message: string;
	tone: ToastTone;
};

/** Tetap ada agar call site lama (`showToast(msg, 'sukses')`) tidak perlu diubah. */
export function showToast(message: string, tone: ToastTone = 'info', durationMs = 4000) {
	const opts = { duration: durationMs };
	switch (tone) {
		case 'sukses':
			return toast.success(message, opts);
		case 'bahaya':
			return toast.error(message, opts);
		case 'peringatan':
			return toast.warning(message, opts);
		case 'info':
			return toast.info(message, opts);
		default: {
			const _exhaustive: never = tone;
			return toast(message, opts);
		}
	}
}

export function dismissToast(id?: string | number) {
	toast.dismiss(id);
}

export function clearToast() {
	toast.dismiss();
}

/** @deprecated tidak tersedia dengan Sonner. */
export function getToasts(): ToastItem[] {
	return [];
}

/** @deprecated tidak tersedia dengan Sonner. */
export function getToast(): string | null {
	return null;
}
