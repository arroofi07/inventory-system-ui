# sistem-barang

Frontend SvelteKit (SPA, TypeScript, Tailwind v4) untuk sistem-barang.

Struktur mengikuti [docs/02-arsitektur-target.md](../docs/02-arsitektur-target.md) bagian 4, dengan penyesuaian route dari [docs/07-frontend-svelte.md](../docs/07-frontend-svelte.md): **satu grup `(app)`** (bukan `(admin)`/`(sales)` terpisah) agar URL tidak bentrok.

## Prasyarat

- Node 20+
- pnpm (disarankan) atau npm

## Setup

```bash
cp .env.example .env
pnpm install
```

## Menjalankan

```bash
pnpm dev
```

App: `http://localhost:5173` (default Vite). API diarahkan ke `VITE_API_BASE_URL`.

## Test / cek tipe

```bash
pnpm check
pnpm test
```

CI GitHub Actions menjalankan keduanya (lihat `.github/workflows/ci.yml`).

## Build SPA

```bash
pnpm build
pnpm preview
```

Memakai `@sveltejs/adapter-static` dengan fallback `200.html`, `ssr = false`.

## Catatan

- Client OpenAPI di `src/lib/api/generated/` di-generate nanti (jangan edit manual).
- Auth, guard role, dan komponen penuh diisi di SA-09 / SA-12.
