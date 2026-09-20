<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';

	let {
		open = $bindable(false),
		message = 'Lanjutkan?',
		onconfirm
	}: {
		open?: boolean;
		message?: string;
		onconfirm?: () => void;
	} = $props();

	function handleConfirm() {
		onconfirm?.();
		open = false;
	}
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Description>{message}</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel class={buttonVariants({ variant: 'outline' })}>Batal</AlertDialog.Cancel>
			<AlertDialog.Action class={buttonVariants()} onclick={handleConfirm}>Ya</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
