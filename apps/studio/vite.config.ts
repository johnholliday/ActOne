import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function serveGuide(): Plugin {
  const guideDir = resolve(__dirname, '../../guide/_site');

  return {
    name: 'serve-guide',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/guide')) return next();

        let urlPath = req.url.replace(/^\/guide/, '') || '/';
        // Strip query string
        const qIdx = urlPath.indexOf('?');
        if (qIdx !== -1) urlPath = urlPath.slice(0, qIdx);
        // Directory → index.html
        if (urlPath.endsWith('/')) urlPath += 'index.html';

        const filePath = join(guideDir, urlPath);

        // Security: prevent path traversal
        if (!filePath.startsWith(guideDir)) return next();

        if (!existsSync(filePath) || !statSync(filePath).isFile()) return next();

        const ext = extname(filePath);
        res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
        res.end(readFileSync(filePath));
      });
    },
  };
}

export default defineConfig({
  plugins: [serveGuide(), tailwindcss(), sveltekit()],
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
