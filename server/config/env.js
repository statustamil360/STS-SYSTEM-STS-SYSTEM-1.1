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

module.exports = { serverRoot, envPath };
