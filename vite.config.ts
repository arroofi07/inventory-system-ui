import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		proxy: {
			// Proxy agar refresh cookie HttpOnly same-origin di development.
			'/api': {
				target: 'http://localhost:8082',
				changeOrigin: true
			}
		}
	}
});
