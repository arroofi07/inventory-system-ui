export type CartItem = {
	kodeBarang: string;
	qty: number;
};

export type CartState = {
	items: CartItem[];
};

export function createEmptyCart(): CartState {
	return { items: [] };
}
