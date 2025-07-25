import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  base: './', // Use relative paths for static deployment
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
});