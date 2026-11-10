import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { handleAvatarApi } from './src/server/avatar-api';
import { handleHackathonApi } from './src/server/hackathon/api';

/**
 * Injects VITE_SITE_URL into index.html. When the URL is not configured yet,
 * absolute-URL tags (canonical, og:url) are removed instead of shipping a placeholder,
 * and og:image falls back to a relative path.
 */
function siteUrlPlugin(siteUrl: string): Plugin {
  const url = siteUrl.replace(/\/+$/, '');
  return {
    name: 'site-url',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        if (url) return html.replace(/%VITE_SITE_URL%/g, url);
        return html
          .split('\n')
          .filter((line) => !/rel="canonical"|property="og:url"|"url": "%VITE_SITE_URL%\/"/.test(line))
          .join('\n')
          .replace(/%VITE_SITE_URL%\//g, '/');
      },
    },
  };
}

/**
 * Mounts the `/api/avatar/*` backend routes directly inside Vite's dev and
 * preview servers so PayU checkout, callbacks, badge verification, and lead
 * storage run identically in local development and production.
 */
function avatarApiPlugin(): Plugin {
  return {
    name: 'avatar-api-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api/hackathon')) {
          handleHackathonApi(req, res).catch(next);
          return;
        }
        if (req.url?.startsWith('/api/avatar')) {
          handleAvatarApi(req, res).catch(next);
          return;
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api/hackathon')) {
          handleHackathonApi(req, res).catch(next);
          return;
        }
        if (req.url?.startsWith('/api/avatar')) {
          handleAvatarApi(req, res).catch(next);
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Populate process.env for server middleware in dev/preview (PayU + Supabase + EmailJS + Sandbox)
  for (const [k, v] of Object.entries(env)) {
    process.env[k] = v;
  }
  return {
    plugins: [react(), tailwindcss(), siteUrlPlugin(env.VITE_SITE_URL ?? ''), avatarApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'es2022',
      outDir: 'build',
      sourcemap: false,
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          // React gets its own chunk so the page never waits on the lazy 3D code.
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (/node_modules\/three\//.test(id)) return 'three';
            if (/@react-three|react-reconciler|its-fine|zustand|suspend-react/.test(id)) return 'r3f';
            if (/node_modules\/(motion|framer-motion|motion-dom|motion-utils)\//.test(id)) return 'motion';
            if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react';
          },
        },
      },
    },
    server: {
      port: 3000,
      open: false,
    },
    preview: {
      port: 4173,
    },
  };
});
