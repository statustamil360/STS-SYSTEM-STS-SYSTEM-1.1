const { buildIceServers } = require('./turnService');

const sanitizeRoomName = (code) => String(code || 'room')
  .toLowerCase()
  .replace(/[^a-z0-9-]/g, '-')
  .replace(/-+/g, '-')
  .slice(0, 48);

exports.getProvider = () => 'webrtc';

exports.ensureRoom = async (conferenceCode) => {
  const roomId = sanitizeRoomName(conferenceCode);
  return {
    provider: 'webrtc',
    roomId,
  };
};

exports.getIceServers = () => buildIceServers();
