import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  base: '/apml-visualiser/', // GitHub Pages repo name
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
});