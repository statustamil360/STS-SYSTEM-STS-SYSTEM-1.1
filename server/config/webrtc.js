/**
 * Private WebRTC / mediasoup configuration.
 * STUN/TURN come from env: Metered (TURN_USERNAME + TURN_PASSWORD) or coturn (TURN_SECRET).
 */
const os = require('os');

const stripQuotes = (value) => String(value || '').trim().replace(/^['"]|['"]$/g, '');

const parseList = (value, fallback = []) => {
  const raw = stripQuotes(value);
  if (!raw) return fallback;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
};

const isUnspecifiedIp = (ip) => !ip || ip === '0.0.0.0' || ip === '::';

const isPrivateIpv4 = (ip) => /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(ip);

const detectLanIPv4 = () => {
  const fromEnv = stripQuotes(process.env.LAN_IP);
  const nets = os.networkInterfaces();
  const found = [];
  Object.values(nets).forEach((addrs) => {
    (addrs || []).forEach((addr) => {
      const family = addr.family === 4 || addr.family === 'IPv4';
      if (family && !addr.internal && isPrivateIpv4(addr.address)) {
        found.push(addr.address);
      }
    });
  });
  if (fromEnv && found.includes(fromEnv)) return fromEnv;
  const wifi = found.find((ip) => ip.startsWith('192.168.'));
  if (wifi) return wifi;
  const rfc172 = found.find((ip) => /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip));
  if (rfc172) return rfc172;
  return found[0] || fromEnv || '';
};

const listenIp = process.env.WEBRTC_LISTEN_IP || '0.0.0.0';
const lanIp = detectLanIPv4();
const announcedIpRaw = stripQuotes(process.env.WEBRTC_ANNOUNCED_IP);
const publicIp = announcedIpRaw && !isPrivateIpv4(announcedIpRaw) && !isUnspecifiedIp(announcedIpRaw)
  ? announcedIpRaw
  : '';

const minPort = Number(process.env.MEDIASOUP_MIN_PORT) || 40000;
const maxPort = Number(process.env.MEDIASOUP_MAX_PORT) || 49999;
const midPort = Math.floor((minPort + maxPort) / 2);

const listenInfos = [];
if (lanIp) {
  listenInfos.push(
    { protocol: 'udp', ip: lanIp, portRange: { min: minPort, max: midPort } },
    { protocol: 'tcp', ip: lanIp, portRange: { min: minPort, max: midPort } },
  );
}
if (publicIp && publicIp !== lanIp) {
  listenInfos.push(
    { protocol: 'udp', ip: listenIp, announcedAddress: publicIp, portRange: { min: midPort + 1, max: maxPort } },
    { protocol: 'tcp', ip: listenIp, announcedAddress: publicIp, portRange: { min: midPort + 1, max: maxPort } },
  );
}
if (!listenInfos.length) {
  listenInfos.push(
    { protocol: 'udp', ip: listenIp, portRange: { min: minPort, max: maxPort } },
    { protocol: 'tcp', ip: listenIp, portRange: { min: minPort, max: maxPort } },
  );
}

const announcedIp = lanIp || publicIp || listenIp;
const announcedAddress = !isUnspecifiedIp(announcedIp) && announcedIp !== listenIp
  ? announcedIp
  : undefined;

module.exports = {
  listenIp,
  lanIp,
  publicIp,
  announcedIp,
  announcedAddress,
  listenInfos,
  minPort,
  maxPort,
  stunUrls: parseList(process.env.STUN_URLS, ['stun:stun.l.google.com:19302']),
  turnUrls: parseList(process.env.TURN_URL),
  turnSecret: stripQuotes(process.env.TURN_SECRET),
  turnTtlSeconds: Number(process.env.TURN_TTL) || 86400,
  turnUsername: stripQuotes(process.env.TURN_USERNAME),
  turnPassword: stripQuotes(process.env.TURN_PASSWORD),
  iceTransportPolicy: String(process.env.ICE_TRANSPORT_POLICY || 'relay').toLowerCase() === 'all'
    ? 'all'
    : 'relay',
};
