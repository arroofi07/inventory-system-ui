export type BadgeTone = 'sukses' | 'peringatan' | 'bahaya' | 'info' | 'netral';

/** Pemetaan status domain → warna (07 §4). */
export function toneDariStatus(status: string): BadgeTone {
	const s = status.toUpperCase();
	switch (s) {
		case 'LUNAS':
		case 'APPROVED':
		case 'NORMAL':
		case 'AKTIF':
		case 'SUKSES':
			return 'sukses';
		case 'SEBAGIAN':
		case 'PENDING':
		case 'RENDAH':
		case 'MENDEKATI_JATUH_TEMPO':
		case 'PERINGATAN':
			return 'peringatan';
		case 'HUTANG':
		case 'REJECTED':
		case 'HABIS':
		case 'OVERDUE':
		case 'BAHAYA':
			return 'bahaya';
		case 'INFO':
			return 'info';
		default:
			return 'netral';
	}
}
