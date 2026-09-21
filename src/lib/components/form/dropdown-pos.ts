import type { Attachment } from 'svelte/attachments';

export type KotakAnchor = {
	top: number;
	left: number;
	bottom: number;
	width: number;
	height: number;
};

export type Viewport = { width: number; height: number };

export type PosisiPanel = {
	top: number;
	left: number;
	width: number;
	maxHeight: number;
};

/** Hitung posisi panel dropdown supaya tidak terpotong viewport. */
export function hitungPosisiPanel(
	kotak: KotakAnchor,
	viewport: Viewport,
	gap = 4
): PosisiPanel {
	const maxH = Math.min(256, viewport.height * 0.45);
	const below = viewport.height - kotak.bottom - gap - 8;
	const above = kotak.top - gap - 8;
	const openUp = below < 140 && above > below;
	const maxHeight = Math.max(96, Math.min(maxH, openUp ? above : below));
	const top = openUp ? kotak.top - gap - maxHeight : kotak.bottom + gap;
	const width = Math.max(kotak.width, 0);
	const left = Math.max(8, Math.min(kotak.left, Math.max(8, viewport.width - width - 8)));
	return { top, left, width, maxHeight };
}

export function terapkanPosisiPanel(node: HTMLElement, anchor: HTMLElement) {
	const r = anchor.getBoundingClientRect();
	const p = hitungPosisiPanel(
		{ top: r.top, left: r.left, bottom: r.bottom, width: r.width, height: r.height },
		{ width: window.innerWidth, height: window.innerHeight }
	);
	node.style.top = `${p.top}px`;
	node.style.left = `${p.left}px`;
	node.style.width = `${p.width}px`;
	node.style.maxHeight = `${p.maxHeight}px`;
}

/** Attachment: pasang panel fixed mengikuti trigger, update saat scroll/resize. */
export function pasangPanelDropdown(anchor: HTMLElement): Attachment<HTMLElement> {
	return (node) => {
		function update() {
			terapkanPosisiPanel(node, anchor);
		}
		update();
		window.addEventListener('resize', update);
		window.addEventListener('scroll', update, true);
		return () => {
			window.removeEventListener('resize', update);
			window.removeEventListener('scroll', update, true);
		};
	};
}
