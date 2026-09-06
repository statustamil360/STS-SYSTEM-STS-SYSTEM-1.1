const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const serverRoot = path.join(__dirname, '..');
const envPath = path.join(serverRoot, '.env');

if (process.cwd() !== serverRoot) {
  process.chdir(serverRoot);
}

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.warn(`[env] No .env file at ${envPath} — using aaPanel/system environment variables only`);
}

const lanIp = String(process.env.LAN_IP || '').trim();
if (lanIp && !String(process.env.WEBRTC_ANNOUNCED_IP || '').trim()) {
  process.env.WEBRTC_ANNOUNCED_IP = lanIp;
}
if (lanIp || process.env.CLIENT_URL || process.env.PUBLIC_URL) {
  console.log(
    `[env] CLIENT_URL=${process.env.CLIENT_URL || ''} PUBLIC_URL=${process.env.PUBLIC_URL || ''} LAN_IP=${lanIp || '(none)'} WEBRTC_ANNOUNCED_IP=${process.env.WEBRTC_ANNOUNCED_IP || ''}`
  );
}

module.exports = { serverRoot, envPath };
