const PRIVATE_LAN_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/i;

const stripSlash = (url) => String(url || '').trim().replace(/\/$/, '');

const configuredOrigins = () => {
  const lanIp = String(process.env.LAN_IP || '').trim();
  const listed = [
    process.env.CLIENT_URL,
    process.env.PUBLIC_URL,
    ...(String(process.env.CORS_ORIGINS || '').split(',')),
    lanIp ? `http://${lanIp}:5173` : '',
    lanIp ? `https://${lanIp}:5173` : '',
    'http://localhost:5173',
    'https://localhost:5173',
  ];
  return listed.map(stripSlash).filter(Boolean);
};

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const normalized = stripSlash(origin);
  if (configuredOrigins().includes(normalized)) return true;
  if (process.env.NODE_ENV !== 'production' && PRIVATE_LAN_ORIGIN.test(normalized)) return true;
  return false;
};

const corsOrigin = (origin, callback) => {
  if (isAllowedOrigin(origin)) return callback(null, true);
  return callback(new Error('Not allowed by CORS'));
};

module.exports = { isAllowedDevOrigin: isAllowedOrigin, isAllowedOrigin, corsOrigin, configuredOrigins };
