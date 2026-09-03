import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

/**
 * Injects VITE_SITE_URL into index.html. When the URL is not configured yet,
 * absolute-URL tags (canonical, og:url) are removed instead of shipping a placeholder,
 * and og:image falls back to a relative path.
 */
function siteUrlPlugin(siteUrl: string): Plugin {
  const url = siteUrl.replace(/\/+$/, '');
  return {
    name: 'site-url',
    transformIndexHtml(html) {
      if (url) return html.replace(/%VITE_SITE_URL%/g, url);
      return html
        .split('\n')
        .filter((line) => !/rel="canonical"|property="og:url"|"url": "%VITE_SITE_URL%\/"/.test(line))
        .join('\n')
        .replace(/%VITE_SITE_URL%\//g, '/');
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    // GitHub Pages serves this from /<repo>/, so assets need that prefix.
    base: env.VITE_BASE ?? '/',
    plugins: [react(), tailwindcss(), siteUrlPlugin(env.VITE_SITE_URL ?? '')],
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
          manualChunks: {
            three: ['three'],
            r3f: ['@react-three/fiber', '@react-three/drei'],
            motion: ['motion'],
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
