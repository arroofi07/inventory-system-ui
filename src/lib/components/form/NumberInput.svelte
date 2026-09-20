<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { isZeroNumeric } from '$lib/domain/format';

	interface Props {
		value?: number | null;
		id?: string;
		name?: string;
		min?: number;
		max?: number;
		step?: number | 'any';
		required?: boolean;
		disabled?: boolean;
		placeholder?: string;
		class?: string;
		onchange?: () => void;
	}

	let {
		value = $bindable(0),
		id,
		name,
		min,
		max,
		step,
		required = false,
		disabled = false,
		placeholder,
		class: className = 'w-full',
		onchange
	}: Props = $props();

	function onFocus() {
		if (isZeroNumeric(value)) value = null;
	}

	function onBlur() {
		if (value === null || value === undefined || Number.isNaN(value)) {
			value = 0;
		}
	}
</script>

<Input
	{id}
	{name}
	{min}
	{max}
	{step}
	{required}
	{disabled}
	{placeholder}
	type="number"
	inputmode="decimal"
	class={className}
	bind:value
	onfocus={onFocus}
	onblur={onBlur}
	onchange={() => onchange?.()}
/>
