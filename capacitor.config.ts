import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor requires `webDir` to contain `index.html` (see `public/index.html`).
 *
 * This project uses Next.js Server Actions and SSR; the native WebView should
 * load your **deployed** site, not only these static files.
 *
 * Before `npx cap sync`, set your production (or dev tunnel) URL, for example:
 *   set CAPACITOR_SERVER_URL=https://your-app.vercel.app
 *   npx cap sync
 * (PowerShell: `$env:CAPACITOR_SERVER_URL="https://..."; npx cap sync`)
 */
const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: 'com.chum.app',
  appName: 'chum',
  webDir: 'public',
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: serverUrl.startsWith('http:'),
        },
      }
    : {}),
};

export default config;
