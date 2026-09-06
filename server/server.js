require('./config/env');

const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('./app');
const { initSocket } = require('./services/socketService');
const { initMediasoup } = require('./services/mediasoupService');
const { serverRoot } = require('./config/env');

const PORT = Number(process.env.PORT) || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (NODE_ENV === 'production') {
  const clientDist = path.join(serverRoot, '..', 'client', 'dist', 'index.html');
  if (!fs.existsSync(clientDist)) {
    console.warn(`[startup] WARNING: ${clientDist} not found — upload client/dist or run "npm run build"`);
  }
}

const server = http.createServer(app);
initSocket(server);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[startup] Port ${PORT} is already in use. Stop the other Node process or change PORT in .env`);
  } else {
    console.error('[startup] Server error:', err.message);
  }
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', async () => {
  console.log(`AMC Teleconference Server running on port ${PORT} (${NODE_ENV})`);
  console.log(`[startup] Working directory: ${process.cwd()}`);
  const lanIp = String(process.env.LAN_IP || '').trim();
  if (lanIp) {
    console.log(`[startup] LAN access: https://${lanIp}:5173  (Vite HTTPS)  |  http://${lanIp}:${PORT}/api/health`);
  }
  if (process.env.CLIENT_URL || process.env.PUBLIC_URL) {
    console.log(`[startup] Public origin: ${process.env.PUBLIC_URL || process.env.CLIENT_URL}`);
  }
  try {
    await initMediasoup();
  } catch (err) {
    console.error('[startup] mediasoup init failed:', err.message);
  }
});

process.on('uncaughtException', (err) => {
  console.error('[startup] Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[startup] Unhandled rejection:', reason);
});
