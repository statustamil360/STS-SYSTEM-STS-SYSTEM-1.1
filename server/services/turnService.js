const crypto = require('crypto');
const webrtcConfig = require('../config/webrtc');

/**
 * Build ICE server list for private WebRTC (STUN + optional TURN).
 * Supports coturn time-limited credentials (TURN_SECRET) or static user/pass.
 */
const buildIceServers = () => {
  const iceServers = [];

  if (webrtcConfig.stunUrls.length) {
    iceServers.push({ urls: webrtcConfig.stunUrls });
  }

  if (webrtcConfig.turnUrl) {
    const entry = { urls: webrtcConfig.turnUrl };

    if (webrtcConfig.turnSecret) {
      const expiry = Math.floor(Date.now() / 1000) + webrtcConfig.turnTtlSeconds;
      const username = `${expiry}:${crypto.randomBytes(8).toString('hex')}`;
      const password = crypto
        .createHmac('sha1', webrtcConfig.turnSecret)
        .update(username)
        .digest('base64');
      entry.username = username;
      entry.credential = password;
    } else if (webrtcConfig.turnUsername && webrtcConfig.turnPassword) {
      entry.username = webrtcConfig.turnUsername;
      entry.credential = webrtcConfig.turnPassword;
    }

    iceServers.push(entry);
  }

  return iceServers;
};

module.exports = { buildIceServers };
