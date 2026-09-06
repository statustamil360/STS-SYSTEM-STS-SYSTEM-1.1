import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.join(rootDir, '..', 'server', '.env');
const envText = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
const envVal = (key) => envText.split(/\r?\n/).find((line) => line.startsWith(`${key}=`))?.split('=').slice(1).join('=').trim();
const lanIp = envVal('LAN_IP');
const publicHost = (() => {
  try {
    return new URL(envVal('PUBLIC_URL') || envVal('CLIENT_URL') || '').hostname;
  } catch {
    return '';
  }
})();

export default defineConfig({
  plugins: [
    react(),
    basicSsl({
      name: 'sts-lan',
      domains: ['localhost', '127.0.0.1', lanIp, publicHost].filter(Boolean),
    }),
  ],
  server: {
    host: true,
    allowedHosts: true,
    port: 5173,
    strictPort: true,
    https: true,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:5000', changeOrigin: true, ws: true },
    },
  },
});
