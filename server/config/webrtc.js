/**
 * Private WebRTC / mediasoup configuration (company-owned video — no Jitsi/Daily).
 */
const parseList = (value, fallback = []) => {
  if (!value || !String(value).trim()) return fallback;
  return String(value).split(',').map((s) => s.trim()).filter(Boolean);
};

const listenIp = process.env.WEBRTC_LISTEN_IP || '0.0.0.0';
const announcedIp = process.env.WEBRTC_ANNOUNCED_IP || listenIp;

module.exports = {
  listenIp,
  announcedIp,
  minPort: Number(process.env.MEDIASOUP_MIN_PORT) || 40000,
  maxPort: Number(process.env.MEDIASOUP_MAX_PORT) || 49999,
  stunUrls: parseList(process.env.STUN_URLS, ['stun:stun.l.google.com:19302']),
  turnUrl: process.env.TURN_URL || '',
  turnSecret: process.env.TURN_SECRET || '',
  turnTtlSeconds: Number(process.env.TURN_TTL) || 86400,
  turnUsername: process.env.TURN_USERNAME || '',
  turnPassword: process.env.TURN_PASSWORD || '',
};
