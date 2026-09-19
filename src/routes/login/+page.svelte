<script lang="ts">
	import { page } from '$app/state';
	import { ApiError } from '$lib/api/http';
	import { pergiKe } from '$lib/nav';
	import { auth } from '$lib/stores/auth.svelte';

	const appName = import.meta.env.VITE_APP_NAME ?? 'PKB Web';

	let email = $state('');
	let password = $state('');
	let errorMsg = $state('');
	let submitting = $state(false);
	let showPassword = $state(false);

	const nextPath = $derived(page.url.searchParams.get('next') || '/dashboard');

	async function onSubmit(e: Event) {
		e.preventDefault();
		errorMsg = '';

		if (!email.trim() || !password) {
			errorMsg = 'Email dan password wajib diisi.';
			return;
		}

		submitting = true;
		try {
			const user = await auth.login(email.trim(), password);
			const target =
				nextPath.startsWith('/') && nextPath !== '/login'
					? nextPath
					: user.role === 'sales'
						? '/transaksi'
						: '/dashboard';
			await pergiKe(target);
		} catch (err) {
			if (err instanceof ApiError) {
				errorMsg = err.body.message || 'Login gagal.';
			} else {
				errorMsg = 'Tidak dapat terhubung ke server. Periksa API berjalan.';
			}
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Masuk · {appName}</title>
</svelte:head>

<div class="login-root">
	<div class="login-atmosphere" aria-hidden="true"></div>
	<div class="login-grid" aria-hidden="true"></div>

	<main class="login-main">
		<section class="login-brand">
			<p class="brand-mark">{appName}</p>
			<h1 class="brand-headline">Distribusi yang terukur, stok yang jelas.</h1>
			<p class="brand-sub">
				Masuk untuk mengelola barang, transaksi, dan laporan penjualan FMCG.
			</p>
		</section>

		<section class="login-panel">
			<header class="panel-head">
				<h2>Masuk</h2>
				<p>Gunakan akun yang diberikan administrator.</p>
			</header>

			<form class="panel-form" onsubmit={onSubmit}>
				{#if errorMsg}
					<div class="alert" role="alert" aria-live="polite">{errorMsg}</div>
				{/if}

				<label class="field">
					<span>Email</span>
					<input
						type="email"
						name="email"
						autocomplete="username"
						bind:value={email}
						placeholder="nama@perusahaan.com"
						required
						disabled={submitting}
					/>
				</label>

				<label class="field">
					<span>Password</span>
					<div class="password-row">
						<input
							type={showPassword ? 'text' : 'password'}
							name="password"
							autocomplete="current-password"
							bind:value={password}
							placeholder="••••••••"
							required
							disabled={submitting}
						/>
						<button
							type="button"
							class="toggle-pw"
							onclick={() => (showPassword = !showPassword)}
							aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
						>
							{showPassword ? 'Sembunyi' : 'Lihat'}
						</button>
					</div>
				</label>

				<button class="submit" type="submit" disabled={submitting}>
					{submitting ? 'Memproses…' : 'Masuk'}
				</button>
			</form>
		</section>
	</main>
</div>

<style>
	@keyframes drift {
		from {
			transform: translate3d(0, 0, 0);
		}
		to {
			transform: translate3d(-2%, 1.5%, 0);
		}
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.login-root {
		position: relative;
		min-height: 100svh;
		overflow: hidden;
		background:
			radial-gradient(1200px 600px at 12% -10%, color-mix(in oklab, var(--color-brand-200) 70%, white), transparent 60%),
			radial-gradient(900px 500px at 90% 110%, color-mix(in oklab, var(--color-brand-100) 80%, white), transparent 55%),
			linear-gradient(160deg, #e8f5ec 0%, var(--color-surface) 42%, #dfece4 100%);
		color: var(--color-ink);
	}

	.login-atmosphere {
		pointer-events: none;
		position: absolute;
		inset: -10%;
		background:
			radial-gradient(circle at 30% 40%, color-mix(in oklab, var(--color-brand-500) 18%, transparent), transparent 35%),
			radial-gradient(circle at 70% 60%, color-mix(in oklab, var(--color-brand-700) 10%, transparent), transparent 40%);
		animation: drift 18s ease-in-out infinite alternate;
	}

	.login-grid {
		pointer-events: none;
		position: absolute;
		inset: 0;
		opacity: 0.35;
		background-image:
			linear-gradient(color-mix(in oklab, var(--color-brand-800) 8%, transparent) 1px, transparent 1px),
			linear-gradient(90deg, color-mix(in oklab, var(--color-brand-800) 8%, transparent) 1px, transparent 1px);
		background-size: 48px 48px;
		mask-image: radial-gradient(ellipse at center, black 20%, transparent 75%);
	}

	.login-main {
		position: relative;
		z-index: 1;
		display: grid;
		gap: 2.5rem;
		align-items: center;
		min-height: 100svh;
		width: min(1080px, calc(100% - 2rem));
		margin-inline: auto;
		padding-block: 2.5rem;
	}

	@media (min-width: 900px) {
		.login-main {
			grid-template-columns: 1.15fr 0.85fr;
			gap: 3.5rem;
		}
	}

	.login-brand {
		animation: rise 0.55s ease-out both;
	}

	.brand-mark {
		font-family: var(--font-display);
		font-size: clamp(2.4rem, 5vw, 3.6rem);
		font-weight: 700;
		letter-spacing: -0.03em;
		line-height: 1.05;
		color: var(--color-brand-800);
		margin: 0;
	}

	.brand-headline {
		margin: 1rem 0 0;
		max-width: 18ch;
		font-family: var(--font-display);
		font-size: clamp(1.35rem, 2.4vw, 1.85rem);
		font-weight: 500;
		line-height: 1.25;
		color: var(--color-ink);
	}

	.brand-sub {
		margin: 0.85rem 0 0;
		max-width: 36ch;
		font-size: 1.05rem;
		line-height: 1.55;
		color: var(--color-muted);
	}

	.login-panel {
		background: color-mix(in oklab, white 88%, var(--color-brand-50));
		border: 1px solid color-mix(in oklab, var(--color-brand-700) 12%, transparent);
		border-radius: var(--radius-card);
		padding: 1.75rem;
		box-shadow: 0 18px 40px -28px color-mix(in oklab, var(--color-brand-800) 45%, transparent);
		backdrop-filter: blur(8px);
		animation: rise 0.6s ease-out 0.08s both;
	}

	.panel-head h2 {
		margin: 0;
		font-family: var(--font-display);
		font-size: 1.45rem;
		font-weight: 600;
	}

	.panel-head p {
		margin: 0.35rem 0 0;
		font-size: 0.95rem;
		color: var(--color-muted);
	}

	.panel-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 1.4rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		font-size: 0.9rem;
		font-weight: 600;
	}

	.field input {
		width: 100%;
		border: 1px solid color-mix(in oklab, var(--color-brand-800) 16%, #cbd5e1);
		border-radius: 0.55rem;
		background: white;
		padding: 0.7rem 0.85rem;
		font: inherit;
		font-weight: 500;
		color: var(--color-ink);
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.field input:focus {
		outline: none;
		border-color: var(--color-brand-600);
		box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-brand-500) 28%, transparent);
	}

	.field input:disabled {
		opacity: 0.65;
	}

	.password-row {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.4rem;
		align-items: center;
	}

	.toggle-pw {
		border: 0;
		background: transparent;
		color: var(--color-brand-700);
		font: inherit;
		font-size: 0.85rem;
		font-weight: 600;
		padding: 0.55rem 0.4rem;
		cursor: pointer;
	}

	.toggle-pw:hover {
		color: var(--color-brand-800);
	}

	.submit {
		margin-top: 0.35rem;
		border: 0;
		border-radius: 0.55rem;
		background: linear-gradient(180deg, var(--color-brand-600), var(--color-brand-700));
		color: white;
		font: inherit;
		font-weight: 700;
		padding: 0.8rem 1rem;
		cursor: pointer;
		transition:
			transform 0.15s ease,
			filter 0.15s ease;
	}

	.submit:hover:not(:disabled) {
		filter: brightness(1.05);
		transform: translateY(-1px);
	}

	.submit:disabled {
		opacity: 0.7;
		cursor: wait;
	}

	.alert {
		border-radius: 0.55rem;
		border: 1px solid color-mix(in oklab, var(--color-bahaya) 35%, transparent);
		background: color-mix(in oklab, var(--color-bahaya) 8%, white);
		color: color-mix(in oklab, var(--color-bahaya) 85%, black);
		padding: 0.7rem 0.85rem;
		font-size: 0.9rem;
		font-weight: 500;
	}
</style>
