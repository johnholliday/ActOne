import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: {
    port: 54530,
  },
  build: {
    // CodeMirror + Langium bundle exceeds 500 kB; raise limit to avoid noise
    chunkSizeWarningLimit: 1700,
  },
  // Note: "Unknown output options: codeSplitting" is a known SvelteKit issue
  // with Vite 7 (https://github.com/sveltejs/kit/issues/15442). Harmless;
  // the build succeeds. Will be resolved upstream.
});
