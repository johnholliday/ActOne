import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { serveGuide } from '@docugenix/sanyam-guide/vite-plugin';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Resolve the sanyam-ai-chat package root via its main export (dist/index.js → package root)
const sanyamChatMain = fileURLToPath(import.meta.resolve('@docugenix/sanyam-ai-chat'));
const sanyamChatRoot = resolve(dirname(sanyamChatMain), '..');

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
  resolve: {
    alias: {
      // sanyam-ai-chat exports map doesn't expose Svelte components; alias the deep path
      '@sanyam-ai-chat/components': resolve(sanyamChatRoot, 'src/components'),
    },
  },
  build: {
    // CodeMirror + Langium bundle exceeds 500 kB; raise limit to avoid noise
    chunkSizeWarningLimit: 1700,
  },
  // Note: "Unknown output options: codeSplitting" is a known SvelteKit issue
  // with Vite 7 (https://github.com/sveltejs/kit/issues/15442). Harmless;
  // the build succeeds. Will be resolved upstream.
});
