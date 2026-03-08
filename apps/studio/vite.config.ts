import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { serveGuide } from '@docugenix/sanyam-guide/vite-plugin';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [
    serveGuide({
      inputDir: resolve(__dirname, '../../guide'),
      outputDir: resolve(__dirname, '../../guide/_site'),
      pathPrefix: '/guide',
    }),
    tailwindcss(),
    sveltekit(),
  ],
  server: {
    port: 54530,
  },
  worker: {
    format: 'es',
  },
  build: {
    // CodeMirror + Langium bundle exceeds 500 kB; raise limit to avoid noise
    chunkSizeWarningLimit: 1700,
  },
  // Note: "Unknown output options: codeSplitting" is a known SvelteKit issue
  // with Vite 7 (https://github.com/sveltejs/kit/issues/15442). Harmless;
  // the build succeeds. Will be resolved upstream.
});
