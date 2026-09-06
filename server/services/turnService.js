const crypto = require('crypto');
const webrtcConfig = require('../config/webrtc');

const coturnCredential = () => {
  const expiry = Math.floor(Date.now() / 1000) + webrtcConfig.turnTtlSeconds;
  const username = `${expiry}:${crypto.randomBytes(8).toString('hex')}`;
  const credential = crypto
    .createHmac('sha1', webrtcConfig.turnSecret)
    .update(username)
    .digest('base64');
  return { username, credential };
};

/**
 * Build ICE servers for mediasoup-client.
 * Metered dashboard format: one entry per URL (UDP 80, TCP 80, UDP 443, TURNS 443).
 */
const buildIceServers = () => {
  const iceServers = [];

  if (webrtcConfig.stunUrls.length) {
    iceServers.push({
      urls: webrtcConfig.stunUrls.length === 1
        ? webrtcConfig.stunUrls[0]
        : webrtcConfig.stunUrls,
    });
  }

  if (!webrtcConfig.turnUrls.length) {
    return iceServers;
  }

  let auth = null;
  if (webrtcConfig.turnUsername && webrtcConfig.turnPassword) {
    auth = {
      username: webrtcConfig.turnUsername,
      credential: webrtcConfig.turnPassword,
      credentialType: 'password',
    };
  } else if (webrtcConfig.turnSecret) {
    auth = { ...coturnCredential(), credentialType: 'password' };
  }

  webrtcConfig.turnUrls.forEach((url) => {
    iceServers.push(auth ? { urls: url, ...auth } : { urls: url });
  });

  return iceServers;
};

module.exports = { buildIceServers };
